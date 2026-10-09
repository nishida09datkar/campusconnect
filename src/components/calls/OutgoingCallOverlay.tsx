import React from 'react';
import { PhoneOff, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ActiveCallData } from '@/hooks/useWebRTC';

interface OutgoingCallOverlayProps {
  call: ActiveCallData | null;
  onCancel: () => void;
}

export const OutgoingCallOverlay: React.FC<OutgoingCallOverlayProps> = ({ call, onCancel }) => {
  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center flex flex-col items-center space-y-6">
        {/* Pulsing Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
            {call.calleeName ? call.calleeName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-background border-2 border-primary text-primary shadow">
            {call.kind === 'VIDEO' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            {call.calleeName || 'Calling...'}
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider animate-pulse">
            Ringing ({call.kind} Call)...
          </p>
        </div>

        {/* Cancel button */}
        <div className="pt-2">
          <Button
            variant="danger"
            onClick={onCancel}
            className="rounded-full px-6 py-2.5 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
