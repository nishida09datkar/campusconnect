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

    // Create RTCPeerConnection and offer
    const pc = createPeerConnection(calleeId, callId);
    if (pc) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketClient.emit('webrtc:offer', {
          targetUserId: calleeId,
          senderUserId: currentUser.id,
          signal: offer,
          callId,
        });
      } catch (e) {
        console.warn('Error creating WebRTC offer:', e);
      }
    }

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
    callLogService.createCallLog(endPayload).catch(() => {});

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
    const handleIncoming = (payload: CallRequestPayload) => {
      // Do not handle own outgoing call as incoming
      if (payload.callerId === currentUser?.id) return;

      // If busy in another call
      if (callStateRef.current !== 'idle' && callStateRef.current !== 'ended') {
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
      if (payload.accepted) {
        setCallState('connected');
      } else {
        setCallState('ended');
        setPermissionError(payload.reason || 'Call was declined');
        cleanupStreamsAndPeer();
        setActiveCall(null);
      }
    };

    const handleCallEnded = () => {
      setCallState('ended');
      cleanupStreamsAndPeer();
      setActiveCall(null);
    };

    const handleOffer = async (payload: WebRtcSignalPayload) => {
      if (payload.senderUserId && payload.senderUserId === currentUser?.id) return;
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.signal));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
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
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.signal));
        setCallState('connected');
      } catch (e) {
        console.warn('Error handling WebRTC answer:', e);
      }
    };

    const handleIce = async (payload: WebRtcSignalPayload) => {
      if (payload.senderUserId && payload.senderUserId === currentUser?.id) return;
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.signal));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    };

    const handleError = (payload: { message: string; code?: string }) => {
      setPermissionError(payload.message);
      setCallState('failed');
      cleanupStreamsAndPeer();
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
  }, [callState, currentUser, cleanupStreamsAndPeer]);

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
    endCall,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
}
