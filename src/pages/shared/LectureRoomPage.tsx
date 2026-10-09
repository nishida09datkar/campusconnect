import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { socketClient } from '@/socket/socketClient';
import {
  LectureParticipant,
  LectureParticipantsPayload,
  LectureControlPayload,
} from '@/socket/events';
import { LectureLobby } from '@/components/lecture/LectureLobby';
import { LectureStage } from '@/components/lecture/LectureStage';
import { LectureControls } from '@/components/lecture/LectureControls';
import { MeshTransport } from '@/components/lecture/transport';

export const LectureRoomPage: React.FC = () => {
  const { roomId = 'lecture-101' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [inLobby, setInLobby] = useState(true);
  const [participants, setParticipants] = useState<LectureParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCapExceeded, setIsCapExceeded] = useState(false);

  const transportRef = useRef<MeshTransport | null>(null);

  const userRole = currentUser?.role || 'STUDENT';
  const isFaculty = userRole === 'FACULTY' || userRole === 'HOD' || userRole === 'ADMIN';

  // Cleanup helper
  const teardownSession = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      setLocalStream(null);
    }
    if (transportRef.current) {
      transportRef.current.destroy();
      transportRef.current = null;
    }
    if (currentUser) {
      socketClient.emit('lecture:leave', {
        roomId,
        userId: currentUser.id,
      });
    }
  }, [localStream, currentUser, roomId]);

  useEffect(() => {
    return () => {
      teardownSession();
    };
  }, [teardownSession]);

  // Handle joining from lobby
  const handleJoinFromLobby = async (settings: {
    isMuted: boolean;
    isCameraOff: boolean;
    stream: MediaStream | null;
  }) => {
    setIsMuted(settings.isMuted);
    setIsCameraOff(settings.isCameraOff);
    setLocalStream(settings.stream);
    setInLobby(false);

    // Initialize Mesh transport
    const transport = new MeshTransport({
      onMeshCapExceeded: () => setIsCapExceeded(true),
    });
    transportRef.current = transport;
    await transport.init(roomId, currentUser?.id || 'guest');
    if (settings.stream) {
      await transport.publishLocalStream(settings.stream);
    }

    // Emit socket join
    if (currentUser) {
      socketClient.emit('lecture:join', {
        roomId,
        userId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
    }
  };

  // Socket listener registrations
  useEffect(() => {
    if (inLobby) return;

    const handleParticipantsUpdate = (payload: LectureParticipantsPayload) => {
      if (payload.roomId === roomId) {
        setParticipants(payload.participants);
        setIsCapExceeded(payload.participants.length > MeshTransport.MESH_CAP);

        // Update local hand raised state from roster
        const me = payload.participants.find((p) => p.userId === currentUser?.id);
        if (me) {
          setIsHandRaised(me.isHandRaised);
          if (me.isMuted && !isMuted) {
            setIsMuted(true);
            if (localStream) {
              localStream.getAudioTracks().forEach((t) => (t.enabled = false));
            }
          }
        }
      }
    };

    const handleControlAction = (payload: LectureControlPayload) => {
      if (payload.roomId === roomId) {
        if (payload.action === 'END_LECTURE') {
          teardownSession();
          navigate('/dashboard');
        } else if (payload.action === 'REMOVE_PARTICIPANT' && payload.targetUserId === currentUser?.id) {
          teardownSession();
          navigate('/dashboard');
        } else if (payload.action === 'MUTE_ALL' && !isFaculty) {
          setIsMuted(true);
          if (localStream) {
            localStream.getAudioTracks().forEach((t) => (t.enabled = false));
          }
        }
      }
    };

    socketClient.on('lecture:participants', handleParticipantsUpdate);
    socketClient.on('lecture:control', handleControlAction);

    return () => {
      socketClient.off('lecture:participants', handleParticipantsUpdate);
      socketClient.off('lecture:control', handleControlAction);
    };
  }, [inLobby, roomId, currentUser, isFaculty, isMuted, localStream, teardownSession, navigate]);

  // Controls
  const handleToggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = isCameraOff;
      });
    }
    setIsCameraOff(!isCameraOff);
  };

  const handleToggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const track = displayStream.getVideoTracks()[0];
          track.onended = () => setIsSharingScreen(false);
          setIsSharingScreen(true);
        }
      } catch {}
    } else {
      setIsSharingScreen(false);
    }
  };

  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (currentUser) {
      socketClient.emit('lecture:hand', {
        roomId,
        userId: currentUser.id,
        raised: nextState,
      });
    }
  };

  const handleMuteAll = () => {
    socketClient.emit('lecture:control', {
      roomId,
      action: 'MUTE_ALL',
    });
  };

  const handleRemoveParticipant = (userId: string) => {
    socketClient.emit('lecture:control', {
      roomId,
      action: 'REMOVE_PARTICIPANT',
      targetUserId: userId,
    });
  };

  const handleEndLecture = () => {
    socketClient.emit('lecture:control', {
      roomId,
      action: 'END_LECTURE',
    });
    teardownSession();
    navigate('/dashboard');
  };

  const handleLeave = () => {
    teardownSession();
    navigate(-1);
  };

  if (inLobby) {
    return (
      <LectureLobby
        roomId={roomId}
        userName={currentUser?.name || 'Student'}
        userRole={userRole}
        onJoin={handleJoinFromLobby}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col justify-between gap-3">
      {/* Interactive Stage & Video Grid */}
      <LectureStage
        roomId={roomId}
        localUserId={currentUser?.id || ''}
        isFaculty={isFaculty}
        participants={participants}
        localStream={localStream}
        remoteStreams={[]}
        isCapExceeded={isCapExceeded}
        onRemoveParticipant={handleRemoveParticipant}
        onLowerHand={(userId) => {
          socketClient.emit('lecture:hand', {
            roomId,
            userId,
            raised: false,
          });
        }}
      />

      {/* Moderation & Participant Control Bar */}
      <LectureControls
        isFaculty={isFaculty}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isSharingScreen={isSharingScreen}
        isHandRaised={isHandRaised}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHand={handleToggleHand}
        onMuteAll={handleMuteAll}
        onLeave={handleLeave}
        onEndLecture={isFaculty ? handleEndLecture : undefined}
      />
    </div>
  );
};

export default LectureRoomPage;
