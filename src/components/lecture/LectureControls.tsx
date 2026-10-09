import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  VolumeX,
  LogOut,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LectureControlsProps {
  isFaculty: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  isHandRaised: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onMuteAll: () => void;
  onLeave: () => void;
  onEndLecture?: () => void;
}

export const LectureControls: React.FC<LectureControlsProps> = ({
  isFaculty,
  isMuted,
  isCameraOff,
  isSharingScreen,
  isHandRaised,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onMuteAll,
  onLeave,
  onEndLecture,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 bg-card/90 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-border shadow-2xl">
      {/* Left section: Common audio/video/screen toggles */}
      <div className="flex items-center gap-2.5">
        <Button
          variant={isMuted ? 'danger' : 'secondary'}
          size="icon"
          onClick={onToggleMute}
          className="rounded-full w-10 h-10 transition-transform active:scale-95"
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        <Button
          variant={isCameraOff ? 'danger' : 'secondary'}
          size="icon"
          onClick={onToggleCamera}
          className="rounded-full w-10 h-10 transition-transform active:scale-95"
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          aria-label={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </Button>

        <Button
          variant={isSharingScreen ? 'primary' : 'secondary'}
          size="icon"
          onClick={onToggleScreenShare}
          className="rounded-full w-10 h-10 transition-transform active:scale-95"
          title={isSharingScreen ? 'Stop Screen Share' : 'Share Screen'}
          aria-label={isSharingScreen ? 'Stop Screen Share' : 'Share Screen'}
        >
          {isSharingScreen ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>

        {/* Raise hand (Primary for students, available to all) */}
        <Button
          variant={isHandRaised ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleHand}
          className={`rounded-full gap-1.5 px-3 transition-transform active:scale-95 ${
            isHandRaised ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
          }`}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand to Ask Question'}
          aria-label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className={`w-4 h-4 ${isHandRaised ? 'animate-bounce' : ''}`} />
          <span className="text-xs font-medium">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </Button>
      </div>

      {/* Right section: Moderation & Leave */}
      <div className="flex items-center gap-2.5">
        {/* Faculty Mute-All */}
        {isFaculty && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMuteAll}
            className="rounded-full gap-1.5 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            title="Mute all students in the room"
            aria-label="Mute all students"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute All</span>
          </Button>
        )}

        {/* Faculty End Lecture */}
        {isFaculty && onEndLecture && (
          <Button
            variant="danger"
            size="sm"
            onClick={onEndLecture}
            className="rounded-full gap-1.5 px-3 text-xs bg-red-600 hover:bg-red-700"
            title="End Lecture for Everyone"
            aria-label="End Lecture for Everyone"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>End Lecture</span>
          </Button>
        )}

        {/* Leave Room */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onLeave}
          className="rounded-full gap-1.5 px-3 text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Leave Room"
          aria-label="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave</span>
        </Button>
      </div>
    </div>
  );
};
