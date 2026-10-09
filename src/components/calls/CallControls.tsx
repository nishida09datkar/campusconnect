import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  qualityBadge?: 'HD' | 'Good' | 'Reconnecting';
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isCameraOff,
  isSharingScreen,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  qualityBadge = 'HD',
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Settings popover */}
      {showSettings && (
        <div className="absolute bottom-16 bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl w-64 text-xs space-y-3 z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <span className="font-semibold text-foreground">Audio & Video Devices</span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Close
            </button>
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Microphone</label>
            <select className="w-full bg-muted/50 border border-input rounded p-1.5 text-foreground text-xs focus:ring-1 focus:ring-primary">
              <option>Default System Microphone</option>
              <option>Communications Microphone</option>
            </select>
          </div>
          <div>
            <label className="text-muted-foreground block mb-1">Camera</label>
            <select className="w-full bg-muted/50 border border-input rounded p-1.5 text-foreground text-xs focus:ring-1 focus:ring-primary">
              <option>Integrated HD Webcam (Default)</option>
            </select>
          </div>
          <div className="pt-1 flex items-center justify-between text-muted-foreground text-[10px]">
            <span>Connection Quality:</span>
            <span className="font-semibold text-emerald-500">{qualityBadge}</span>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md px-6 py-3 rounded-full border border-border shadow-xl">
        {/* Quality indicator badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            qualityBadge === 'HD'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : qualityBadge === 'Good'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
          }`}
          title="WebRTC Connection Quality"
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>{qualityBadge}</span>
        </div>

        {/* Audio Mute */}
        <Button
          variant={isMuted ? 'danger' : 'secondary'}
          size="icon"
          onClick={onToggleMute}
          className="rounded-full w-11 h-11 transition-transform active:scale-95"
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        {/* Video Toggle */}
        <Button
          variant={isCameraOff ? 'danger' : 'secondary'}
          size="icon"
          onClick={onToggleCamera}
          className="rounded-full w-11 h-11 transition-transform active:scale-95"
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        {/* Screen Share */}
        <Button
          variant={isSharingScreen ? 'primary' : 'secondary'}
          size="icon"
          onClick={onToggleScreenShare}
          className="rounded-full w-11 h-11 transition-transform active:scale-95"
          title={isSharingScreen ? 'Stop screen sharing' : 'Share screen'}
          aria-label={isSharingScreen ? 'Stop screen sharing' : 'Share screen'}
        >
          {isSharingScreen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        {/* Settings / Device Selector */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowSettings((prev) => !prev)}
          className="rounded-full w-11 h-11 transition-transform active:scale-95"
          title="Device Settings"
          aria-label="Device Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        {/* End Call */}
        <Button
          variant="danger"
          size="icon"
          onClick={onEndCall}
          className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-md shadow-red-500/20"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
