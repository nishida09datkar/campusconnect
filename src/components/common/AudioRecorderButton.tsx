import React from 'react';
import { Mic, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderButtonProps {
  onAudioRecorded: (result: { blob: Blob; url: string; durationSec: number }) => void;
  onCancel?: () => void;
  className?: string;
  buttonText?: string;
  compact?: boolean;
  disabled?: boolean;
}

export const AudioRecorderButton: React.FC<AudioRecorderButtonProps> = ({
  onAudioRecorded,
  onCancel,
  className = '',
  buttonText = 'Record Voice Note',
  compact = false,
  disabled = false,
}) => {
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleStop = async () => {
    const res = await stopRecording();
    if (res) {
      onAudioRecorded(res);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    if (onCancel) onCancel();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isRecording) {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-1.5 animate-in fade-in duration-150 ${className}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
        </span>

        <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
          {formatTimer(recordingDuration)}
        </span>

        <button
          type="button"
          onClick={handleCancel}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Discard audio recording"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleStop}
          className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition-colors"
          title="Done recording"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => startRecording()}
      className={`text-xs gap-1.5 hover:text-primary hover:border-primary/40 transition-colors ${
        compact ? 'h-9 w-9 p-0 rounded-lg shrink-0' : 'h-8 px-2.5 rounded-lg'
      } ${className}`}
      title="Record an audio voice note"
    >
      <Mic className="w-3.5 h-3.5 text-primary" />
      {!compact && <span>{buttonText}</span>}
    </Button>
  );
};
