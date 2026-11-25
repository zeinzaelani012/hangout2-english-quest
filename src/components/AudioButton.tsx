import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, LoaderCircle } from 'lucide-react';
import { play, stop, isSpeaking, type AudioRole } from '../lib/audio';

interface AudioButtonProps {
  /** Kept for compatibility with existing callers; clips resolve by text now. */
  audioKey: string;
  /** The script that will be spoken — also the accessible name. */
  fallbackText: string;
  /** Explicit rate override; otherwise the level multiplier x user rate. */
  rate?: number;
  /** Optional visible label shown beside the speaker icon. */
  label?: string;
  className?: string;
  /** Notified on every playback start (used to count replays). */
  onPlay?: () => void;
  /** Blocks playback (e.g. when a replay allowance is spent). */
  disabled?: boolean;
  /** Max plays for listening stations: Easy unlimited, Core 2, Challenging 1. */
  maxPlays?: number;
  /** Level for the rate multiplier. */
  level?: 'easy' | 'core' | 'challenging';
  /** Speaker role — dialogue characters get their own voice/pitch. */
  role?: AudioRole;
}

/**
 * The play control used across the app. Phase 8: aria name includes the
 * script ("Play: <text>"), aria-live announces state, plays are counted for
 * replay limits, and a visible stop control shows while playing.
 */
export function AudioButton({
  audioKey: _audioKey,
  fallbackText,
  rate,
  label,
  className = '',
  onPlay,
  disabled = false,
  maxPlays,
  level,
  role,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [plays, setPlays] = useState(0);
  const playIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      playIdRef.current++;
      stop();
    };
  }, []);

  const finiteLimit = typeof maxPlays === 'number' && maxPlays !== 0;
  const limitReached = finiteLimit && plays >= (maxPlays as number);

  const handlePlay = useCallback(() => {
    if (playing || loading || disabled || limitReached) return;
    const thisPlay = ++playIdRef.current;
    setError(false);
    setLoading(true);
    setPlaying(true);
    onPlay?.();
    setPlays(p => p + 1);

    play(fallbackText, { level, rate, role })
      .then(() => {
        if (mountedRef.current && playIdRef.current === thisPlay) {
          setPlaying(false);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (mountedRef.current && playIdRef.current === thisPlay) {
          setPlaying(false);
          setLoading(false);
          if (err?.message !== 'stopped') {
            setError(true);
            setPlays(p => Math.max(0, p - 1));
          }
        }
      });
  }, [playing, loading, disabled, limitReached, fallbackText, onPlay, level, rate, role]);

  const handleStop = useCallback(() => {
    playIdRef.current++;
    stop();
    setPlaying(false);
    setLoading(false);
  }, []);

  const icon = loading ? <LoaderCircle size={20} className="animate-spin" aria-hidden /> : playing ? <VolumeX size={20} aria-hidden /> : <Volume2 size={20} aria-hidden />;
  const accessibleName = `${playing ? 'Stop' : 'Play'}: ${fallbackText}`;
  const blocked = disabled || limitReached;

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-center gap-2">
        <button
          onClick={playing ? handleStop : handlePlay}
          disabled={blocked}
          className="inline-flex items-center justify-center rounded-pill bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
          aria-label={accessibleName}
          title={accessibleName}
          aria-live="polite"
        >
          {icon}
          {label && <span className="ml-1.5 text-sm font-medium">{label}</span>}
        </button>
        {finiteLimit && (
          <span className="tnum text-xs font-semibold text-muted" aria-label={`${Math.max(0, (maxPlays as number) - plays)} plays left`}>
            {maxPlays === 0 ? '' : `${Math.max(0, (maxPlays as number) - plays)} ${Math.max(0, (maxPlays as number) - plays) === 1 ? 'play' : 'plays'} left`}
          </span>
        )}
      </span>
      {limitReached && !playing && (
        <span className="mt-1 text-xs font-semibold text-muted">You've used your replay. Choose your answer.</span>
      )}
      {error && !playing && (
        <span className="mt-1 text-xs text-coral">Couldn't play — try again.</span>
      )}
      <span aria-live="polite" className="sr-only">
        {playing ? 'Playing.' : 'Finished.'}
      </span>
    </span>
  );
}

export function audioPlayingNow(): boolean {
  return isSpeaking();
}
