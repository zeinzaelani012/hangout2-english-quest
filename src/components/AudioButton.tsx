import { useState, useRef, useEffect } from 'react';
import { play, stopAudio, isAudioSupported } from '../lib/audio';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioButtonProps {
  audioKey: string;
  fallbackText: string;
  rate?: number;
  label?: string;
  className?: string;
  /** Notified on every playback start (used to count replays). */
  onPlay?: () => void;
  /** Blocks playback (e.g. when a replay allowance is spent). */
  disabled?: boolean;
}

export function AudioButton({ audioKey, fallbackText, rate = 0.9, label, className = '', onPlay, disabled = false }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, []);

  if (!isAudioSupported()) {
    return null;
  }

  const handleClick = () => {
    if (disabled) return;
    if (playing) {
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    onPlay?.();
    play(audioKey, fallbackText, rate);

    // Estimate duration based on text length
    const estimatedDuration = Math.max(2000, fallbackText.length * 80);
    setTimeout(() => {
      if (mountedRef.current) setPlaying(false);
    }, estimatedDuration);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-pill bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
      aria-label={label || `Play audio: ${fallbackText}`}
      title={label || `Play audio: ${fallbackText}`}
    >
      {playing ? <VolumeX size={20} /> : <Volume2 size={20} />}
      {label && <span className="ml-1.5 text-sm font-medium">{label}</span>}
    </button>
  );
}
