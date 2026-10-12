import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LectureLobbyProps {
  roomId: string;
  userName: string;
  userRole: string;
  onJoin: (settings: { isMuted: boolean; isCameraOff: boolean; stream: MediaStream | null }) => void;
}

export const LectureLobby: React.FC<LectureLobbyProps> = ({
  roomId,
  userName,
  userRole,
  onJoin,
}) => {
  const isStudent = userRole === 'STUDENT';
  const [isMuted, setIsMuted] = useState(isStudent);
  const [isCameraOff, setIsCameraOff] = useState(isStudent);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const handedOffRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;
    async function setupPreview() {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const acquired = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: !isStudent,
          });
          if (cancelled) {
            acquired.getTracks().forEach((t) => t.stop());
            return;
          }
          localStream = acquired;
          setStream(acquired);
        }
      } catch (err) {
        console.warn('Lobby camera/mic preview access denied or unavailable:', err);
      }
    }

    setupPreview();

    return () => {
      cancelled = true;
      // Once joined, the lecture room owns the stream; stopping it here would kill its mic and camera.
      if (localStream && !handedOffRef.current) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isStudent]);

  useEffect(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted;
    });
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !isCameraOff;
    });
  }, [stream, isMuted, isCameraOff]);

  const toggleMute = () => setIsMuted(!isMuted);

  const toggleCamera = () => setIsCameraOff(!isCameraOff);

  const handleJoin = () => {
    handedOffRef.current = true;
    onJoin({ isMuted, isCameraOff, stream });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Interactive Lecture Lobby</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lecture Session: {roomId}</h1>
          <p className="text-sm text-muted-foreground">
            Check your audio and video settings before joining the live classroom
          </p>
        </div>

        {/* Video Preview Box */}
        <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-border flex items-center justify-center">
          {!isCameraOff && stream && stream.getVideoTracks().length > 0 ? (
            <video
              ref={(el) => {
                if (el && el.srcObject !== stream) el.srcObject = stream;
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/50 space-y-2">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-white/70">
                {userName.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs">Camera is turned off {isStudent && '(Default for students)'}</p>
            </div>
          )}

          {/* Quick Toggle Overlays */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              size="icon"
              onClick={toggleMute}
              className="rounded-full shadow-lg"
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              variant={isCameraOff ? 'danger' : 'secondary'}
              size="icon"
              onClick={toggleCamera}
              className="rounded-full shadow-lg"
              title={isCameraOff ? 'Turn Video On' : 'Turn Video Off'}
              aria-label={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Identity & Status */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground block">Joining as</span>
            <span className="font-semibold text-foreground text-sm">{userName}</span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
              {userRole}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>Audio & Mic Ready</span>
          </div>
        </div>

        {/* Join Button */}
        <Button
          variant="primary"
          onClick={handleJoin}
          className="w-full py-6 text-base font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <span>Join Lecture Room</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
