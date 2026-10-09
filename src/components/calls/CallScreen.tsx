import React, { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Maximize2, Minimize2 } from 'lucide-react';
import { ActiveCallData } from '@/hooks/useWebRTC';
import { CallControls } from './CallControls';

interface CallScreenProps {
  call: ActiveCallData;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  call,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isSharingScreen,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Call duration counter
  useEffect(() => {
    const interval = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOff]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const peerDisplayName = call.calleeName || call.callerName || 'Peer Participant';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300"
    >
      {/* Top Bar: Caller info, timer, fullscreen */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
            {peerDisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{peerDisplayName}</h3>
            <p className="text-white/60 text-xs font-mono">{formatTimer(durationSec)}</p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Remote View */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
        {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white/40 shadow-inner">
              <UserIcon className="w-16 h-16" />
            </div>
            <p className="text-white/80 font-medium text-lg">{peerDisplayName}</p>
            <p className="text-white/40 text-xs">Audio Connected</p>
          </div>
        )}

        {/* Local Video PiP (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-6 z-20 w-44 sm:w-56 aspect-video bg-slate-900 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl transition-transform hover:scale-105">
          {localStream && !isCameraOff && localStream.getVideoTracks().length > 0 ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-white/50 text-xs gap-1">
              <UserIcon className="w-6 h-6" />
              <span>Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
            You {isMuted && '(Muted)'}
          </div>
        </div>
      </div>

      {/* Bottom Floating Call Controls */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center px-4">
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isSharingScreen={isSharingScreen}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
          qualityBadge="HD"
        />
      </div>
    </div>
  );
};
