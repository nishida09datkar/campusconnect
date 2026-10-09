import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, Download } from 'lucide-react';
import { audioEngine } from '@/utils/audioEngine';

interface AudioPlayerProps {
  src: string;
  title?: string;
  duration?: number;
  compact?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = 'Voice Note',
  duration = 0,
  compact = false,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration > 0 ? duration : 3);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial duration if prop changes
  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  // Clean up on unmount or src change
  useEffect(() => {
    return () => {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    };
  }, [src]);

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    const fileName = title.toLowerCase().endsWith('.wav')
      ? title
      : `${title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.wav`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      // Try HTML5 audio first if possible
      let htmlAudioSuccess = false;
      if (audioRef.current && src) {
        try {
          audioRef.current.volume = isMuted ? 0 : 1;
          audioRef.current.playbackRate = playbackRate;
          await audioRef.current.play();
          htmlAudioSuccess = true;
        } catch {
          // HTML5 audio playback failed (e.g. data URI or codec restriction)
          htmlAudioSuccess = false;
        }
      }

      // If HTML5 audio didn't play or errored, use Universal Web Audio Engine
      if (!htmlAudioSuccess) {
        await audioEngine.play(src, {
          durationSec: totalDuration,
          playbackRate,
          isMuted,
          onProgress: (time) => {
            setCurrentTime(time);
          },
          onEnded: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
        });
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    audioEngine.setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // 20 waveform bars
  const defaultWaveBars = [30, 60, 45, 90, 75, 40, 85, 95, 60, 50, 80, 100, 70, 40, 65, 80, 45, 90, 60, 35];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        compact
          ? 'bg-muted/40 border-border/80 p-2.5 max-w-xs'
          : 'bg-card border-border p-3.5 shadow-sm max-w-md'
      } ${className}`}
    >
      {/* Hidden audio element for standard HTML5 playback if supported */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground min-w-0">
          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mic className="w-3 h-3" />
          </div>
          <span className="truncate">{title}</span>
          <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            WAV
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 rounded font-mono font-medium hover:bg-muted text-foreground/80 transition-colors"
            title="Change playback speed"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-destructive" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Download .wav audio file"
            aria-label="Download audio file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Controls & Waveform */}
      <div className="flex items-center gap-3">
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-sm"
          title={isPlaying ? 'Pause' : 'Play audio recording'}
          aria-label={isPlaying ? 'Pause audio recording' : 'Play audio recording'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 ml-0.5 fill-current" />
          )}
        </button>

        {/* Waveform / Scrubber */}
        <div className="flex-1 space-y-1">
          <div className="relative flex items-center h-6 cursor-pointer group">
            {/* Visual Waveform Bars with dynamic pulse when active */}
            <div className="absolute inset-0 flex items-center justify-between gap-0.5 px-0.5">
              {defaultWaveBars.map((height, i) => {
                const barPercent = (i / defaultWaveBars.length) * 100;
                const isPassed = barPercent <= progressPercent;
                // Add subtle animation when playing
                const dynamicHeight = isPlaying && isPassed ? Math.min(100, height + (i % 3) * 10) : height;

                return (
                  <div
                    key={i}
                    style={{ height: `${dynamicHeight}%` }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPassed
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                    }`}
                  />
                );
              })}
            </div>

            {/* Invisible Range Input for Smooth Scrubbing */}
            <input
              type="range"
              min={0}
              max={totalDuration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Seek audio position"
              aria-label="Seek audio position"
            />
          </div>

          {/* Time Display */}
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
