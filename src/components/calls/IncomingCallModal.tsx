import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ActiveCallData } from '@/hooks/useWebRTC';

interface IncomingCallModalProps {
  call: ActiveCallData | null;
  onAccept: () => void;
  onDecline: (reason?: string) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized web audio ringtone chime
  useEffect(() => {
    if (!call) return;

    let isCancelled = false;
    setTimeLeft(30);

    const playRingCycle = () => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1); // Tone harmony

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch (e) {
        // User interaction requirement or audio blocked
      }
    };

    playRingCycle();
    const interval = setInterval(playRingCycle, 3000);

    // 30s countdown timeout to auto-miss call
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onDecline('Timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, [call, onDecline]);

  if (!call) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Incoming Call"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="relative bg-card border border-primary/20 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center flex flex-col items-center space-y-6 overflow-hidden">
        {/* Pulsing ring background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Avatar with animated pulsing radar ripples */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" />
          <div className="absolute -inset-2 rounded-full border-2 border-primary/40 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
            {call.callerName ? call.callerName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-background border-2 border-primary text-primary shadow">
            {call.kind === 'VIDEO' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            {call.callerName || 'Incoming Caller'}
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Incoming {call.kind} Call
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-muted/60 text-[11px] text-muted-foreground border border-border">
            Auto-misses in {timeLeft}s
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 pt-2 w-full">
          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="danger"
              size="icon"
              onClick={() => onDecline('Declined')}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-transform active:scale-95"
              aria-label="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="primary"
              size="icon"
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 animate-bounce"
              aria-label="Accept Call"
            >
              <Phone className="w-6 h-6" />
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
