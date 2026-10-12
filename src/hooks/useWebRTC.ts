import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { socketClient } from '@/socket/socketClient';
import {
  CallRequestPayload,
  CallResponsePayload,
  CallEndPayload,
  WebRtcSignalPayload,
  CallKind,
} from '@/socket/events';
import { CallState } from '@/types/communication';
import { User } from '@/types';
import { canInteract } from '@/utils/permissions';
import { db } from '@/api/mock/db';
import { USE_MOCKS } from '@/api/config';
import { callLogService } from '@/api/services/callLog.service';

const STUN_URL = import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302';
const TURN_URL = import.meta.env.VITE_TURN_URL;
const TURN_USER = import.meta.env.VITE_TURN_USER;
const TURN_PASS = import.meta.env.VITE_TURN_PASS;

function getRtcConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [{ urls: STUN_URL }];
  if (TURN_URL) {
    iceServers.push({
      urls: TURN_URL,
      username: TURN_USER,
      credential: TURN_PASS,
    });
  }
  return { iceServers };
}

export interface ActiveCallData {
  callId: string;
  callerId: string;
  callerName?: string;
  calleeId: string;
  calleeName?: string;
  kind: CallKind;
  roomId?: string;
  startedAt?: string;
}

export function useWebRTC() {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const activeCallRef = useRef<ActiveCallData | null>(null);
  activeCallRef.current = activeCall;
  const callStateRef = useRef<CallState>('idle');
  callStateRef.current = callState;

  // Cleanup helper
  const cleanupStreamsAndPeer = useCallback(() => {
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch {}
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    pendingIceRef.current = [];

    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsSharingScreen(false);
  }, []);

  // Guarantee cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStreamsAndPeer();
    };
  }, [cleanupStreamsAndPeer]);

  // Create PeerConnection
  const createPeerConnection = useCallback((targetUserId: string, callId: string) => {
    if (typeof RTCPeerConnection === 'undefined') return null;

    const pc = new RTCPeerConnection(getRtcConfiguration());
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && currentUser) {
        socketClient.emit('webrtc:ice', {
          targetUserId,
          senderUserId: currentUser.id,
          signal: event.candidate.toJSON(),
          callId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    // Attach local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch {}
      });
    }

    return pc;
  }, [currentUser]);

  // Start Call (Caller)
  const startCall = useCallback(async (
    calleeId: string,
    kind: CallKind,
    calleeUser?: User
  ): Promise<boolean> => {
    if (!currentUser) return false;

    // Check permissions
    const target = calleeUser || db.users.find((u) => u.id === calleeId);
    if (!target || !canInteract(currentUser, target, 'call')) {
      const err = `Cannot initiate call: Communication policy restricts calling this user.`;
      setPermissionError(err);
      return false;
    }

    setPermissionError(null);
    cleanupStreamsAndPeer();

    // 1. Get User Media
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: kind === 'VIDEO',
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
      }
    } catch (err: any) {
      setPermissionError('Camera or microphone permission was denied. Please allow access in browser settings.');
      return false;
    }

    const callId = `call-${Date.now()}`;
    const callData: ActiveCallData = {
      callId,
      callerId: currentUser.id,
      callerName: currentUser.name,
      calleeId,
      calleeName: target.name,
      kind,
      startedAt: new Date().toISOString(),
    };

    setActiveCall(callData);
    setCallState('calling');

    // The offer is sent once the callee accepts; before that they have no peer connection to receive it.
    createPeerConnection(calleeId, callId);

    // Emit call:request to signaling server
    const reqPayload: CallRequestPayload = {
      callId,
      callerId: currentUser.id,
      callerName: currentUser.name,
      calleeId,
      kind,
    };
    socketClient.emit('call:request', reqPayload);
    return true;
  }, [currentUser, cleanupStreamsAndPeer, createPeerConnection]);

  // Accept Call (Callee)
  const acceptCall = useCallback(async () => {
    if (!activeCall || !currentUser) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.kind === 'VIDEO',
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
      }
    } catch (err: any) {
      setPermissionError('Microphone or Camera access is required to accept the call.');
      return;
    }

    setCallState('connecting');

    createPeerConnection(activeCall.callerId, activeCall.callId);

    // Emit accept response
    const resp: CallResponsePayload = {
      callId: activeCall.callId,
      callerId: activeCall.callerId,
      calleeId: currentUser.id,
      accepted: true,
    };
    socketClient.emit('call:response', resp);
  }, [activeCall, currentUser, createPeerConnection]);

  // Decline Call (Callee)
  const declineCall = useCallback((reason = 'Declined') => {
    if (!activeCall || !currentUser) return;

    const resp: CallResponsePayload = {
      callId: activeCall.callId,
      callerId: activeCall.callerId,
      calleeId: currentUser.id,
      accepted: false,
      reason,
    };
    socketClient.emit('call:response', resp);

    setCallState('ended');
    cleanupStreamsAndPeer();
    setActiveCall(null);
  }, [activeCall, currentUser, cleanupStreamsAndPeer]);

  // Cancel Call (Caller, before the callee answers)
  const cancelCall = useCallback(() => {
    if (!activeCall || !currentUser) return;

    socketClient.emit('call:cancel', {
      callId: activeCall.callId,
      calleeId: activeCall.calleeId,
    });

    setCallState('ended');
    cleanupStreamsAndPeer();
    setActiveCall(null);
  }, [activeCall, currentUser, cleanupStreamsAndPeer]);

  // End Call (Either party)
  const endCall = useCallback(() => {
    if (!activeCall || !currentUser) return;

    const endPayload: CallEndPayload = {
      callId: activeCall.callId,
      callerId: activeCall.callerId,
      calleeId: activeCall.calleeId,
      kind: activeCall.kind,
      startedAt: activeCall.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      outcome: 'COMPLETED',
    };

    socketClient.emit('call:end', endPayload);
    // Against the live backend the signaling server records the call; writing it here too would duplicate it
    if (USE_MOCKS) {
      callLogService.createCallLog(endPayload).catch(() => {});
    }

    setCallState('ended');
    cleanupStreamsAndPeer();
    setActiveCall(null);
  }, [activeCall, currentUser, cleanupStreamsAndPeer]);

  // Controls
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsSharingScreen(true);
    } catch {
      // User cancelled picker
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (pcRef.current && localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      const videoSender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (videoSender && camTrack) {
        videoSender.replaceTrack(camTrack);
      }
    }
    setIsSharingScreen(false);
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    const isCurrentCall = (callId?: string) =>
      !callId || callId === activeCallRef.current?.callId;

    const flushPendingIce = async (pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current;
      pendingIceRef.current = [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    };

    const handleIncoming = (payload: CallRequestPayload) => {
      // Do not handle own outgoing call as incoming
      if (payload.callerId === currentUser?.id) return;
      // The mock socket broadcasts to every tab, so ignore calls addressed to someone else
      if (payload.calleeId && payload.calleeId !== currentUser?.id) return;

      // If busy in another call
      if (!['idle', 'ended', 'failed'].includes(callStateRef.current)) {
        socketClient.emit('call:response', {
          callId: payload.callId,
          callerId: payload.callerId,
          calleeId: payload.calleeId,
          accepted: false,
          reason: 'User busy in another call',
        });
        return;
      }

      const caller = db.users.find((u) => u.id === payload.callerId);
      setActiveCall({
        callId: payload.callId,
        callerId: payload.callerId,
        callerName: payload.callerName || caller?.name || 'Incoming Caller',
        calleeId: payload.calleeId,
        kind: payload.kind,
        startedAt: new Date().toISOString(),
      });
      setCallState('ringing');
    };

    const handleResponse = async (payload: CallResponsePayload) => {
      // Only the caller acts on a response; the callee already knows its own answer
      if (payload.callerId !== currentUser?.id || payload.callId !== activeCallRef.current?.callId) {
        return;
      }
      // Only the first answer counts; a later one (e.g. another device timing out) must not end the call
      if (callStateRef.current !== 'calling') return;

      if (!payload.accepted) {
        setCallState('ended');
        setPermissionError(payload.reason || 'Call was declined');
        cleanupStreamsAndPeer();
        setActiveCall(null);
        return;
      }

      const pc = pcRef.current;
      if (!pc) {
        setCallState('connected');
        return;
      }

      setCallState('connecting');
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketClient.emit('webrtc:offer', {
          targetUserId: payload.calleeId,
          senderUserId: currentUser?.id,
          signal: offer,
          callId: payload.callId,
        });
      } catch (e) {
        console.warn('Error creating WebRTC offer:', e);
      }
    };

    const handleCallEnded = (payload: { callId: string }) => {
      // The mock socket broadcasts to every tab, so ignore the end of somebody else's call
      if (!activeCallRef.current || payload?.callId !== activeCallRef.current.callId) return;
      setCallState('ended');
      cleanupStreamsAndPeer();
      setActiveCall(null);
    };

    const handleOffer = async (payload: WebRtcSignalPayload) => {
      if (payload.senderUserId && payload.senderUserId === currentUser?.id) return;
      const pc = pcRef.current;
      if (!pc || !isCurrentCall(payload.callId)) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
        await flushPendingIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketClient.emit('webrtc:answer', {
          targetUserId: payload.senderUserId || activeCallRef.current?.callerId || '',
          senderUserId: currentUser?.id,
          signal: answer,
          callId: payload.callId,
        });
        setCallState('connected');
      } catch (e) {
        console.warn('Error handling WebRTC offer:', e);
      }
    };

    const handleAnswer = async (payload: WebRtcSignalPayload) => {
      if (payload.senderUserId && payload.senderUserId === currentUser?.id) return;
      const pc = pcRef.current;
      if (!pc || !isCurrentCall(payload.callId)) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
        await flushPendingIce(pc);
        setCallState('connected');
      } catch (e) {
        console.warn('Error handling WebRTC answer:', e);
      }
    };

    const handleIce = async (payload: WebRtcSignalPayload) => {
      if (payload.senderUserId && payload.senderUserId === currentUser?.id) return;
      const pc = pcRef.current;
      if (!pc || !isCurrentCall(payload.callId)) return;
      // addIceCandidate rejects until the remote description is set
      if (!pc.remoteDescription) {
        pendingIceRef.current.push(payload.signal);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.signal));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    };

    const handleError = (payload: { message: string; code?: string }) => {
      setPermissionError(payload.message);
      setCallState('failed');
      cleanupStreamsAndPeer();
      setActiveCall(null);
    };

    socketClient.on('call:incoming', handleIncoming);
    socketClient.on('call:response', handleResponse);
    socketClient.on('call:ended', handleCallEnded);
    socketClient.on('call:cancel', handleCallEnded);
    socketClient.on('webrtc:offer', handleOffer);
    socketClient.on('webrtc:answer', handleAnswer);
    socketClient.on('webrtc:ice', handleIce);
    socketClient.on('call:error', handleError);

    return () => {
      socketClient.off('call:incoming', handleIncoming);
      socketClient.off('call:response', handleResponse);
      socketClient.off('call:ended', handleCallEnded);
      socketClient.off('call:cancel', handleCallEnded);
      socketClient.off('webrtc:offer', handleOffer);
      socketClient.off('webrtc:answer', handleAnswer);
      socketClient.off('webrtc:ice', handleIce);
      socketClient.off('call:error', handleError);
    };
  }, [currentUser, cleanupStreamsAndPeer]);

  return {
    callState,
    activeCall,
    localStream,
    remoteStream,
    remoteStreams: remoteStream ? [remoteStream] : [],
    isMuted,
    isCameraOff,
    isSharingScreen,
    permissionError,
    clearPermissionError: () => setPermissionError(null),
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
}
