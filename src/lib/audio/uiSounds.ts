import { loadAudioSettings } from './settings';

export type UiSoundCue = 'select' | 'correct' | 'retry' | 'next' | 'complete';

interface Tone {
  frequency: number;
  offset: number;
  duration: number;
  type?: OscillatorType;
}

const CUES: Record<UiSoundCue, Tone[]> = {
  select: [{ frequency: 620, offset: 0, duration: 0.045, type: 'sine' }],
  correct: [
    { frequency: 660, offset: 0, duration: 0.075, type: 'sine' },
    { frequency: 880, offset: 0.075, duration: 0.12, type: 'sine' },
  ],
  retry: [{ frequency: 420, offset: 0, duration: 0.11, type: 'sine' }],
  next: [
    { frequency: 520, offset: 0, duration: 0.045, type: 'sine' },
    { frequency: 700, offset: 0.045, duration: 0.07, type: 'sine' },
  ],
  complete: [
    { frequency: 587, offset: 0, duration: 0.08, type: 'sine' },
    { frequency: 740, offset: 0.075, duration: 0.08, type: 'sine' },
    { frequency: 880, offset: 0.15, duration: 0.16, type: 'sine' },
  ],
};

let context: AudioContext | null = null;
let lastPlayedAt = 0;
let unlockInstalled = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) return null;
  try {
    context ??= new AudioContextCtor();
    return context;
  } catch {
    return null;
  }
}

/**
 * Resume on the first real user gesture so subsequent cues can be scheduled
 * without making any individual control responsible for unlocking audio.
 */
export function installUiSoundUnlock(): void {
  if (typeof window === 'undefined' || unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    const audio = getContext();
    if (audio?.state === 'suspended') void audio.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

/** Play a brief semantic interface cue. This is independent of music/speech. */
export function playUiSound(cue: UiSoundCue): void {
  const settings = loadAudioSettings();
  if (!settings.uiSoundsEnabled || settings.uiSoundsVolume <= 0) return;

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastPlayedAt < 45) return;
  lastPlayedAt = now;

  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') {
    // The semantic action itself is a user gesture. Resume and schedule once
    // the browser unlocks the context (not on a background timer).
    void audio.resume().then(() => scheduleCue(audio, cue, settings.uiSoundsVolume)).catch(() => {});
    return;
  }
  if (audio.state !== 'running') return;
  scheduleCue(audio, cue, settings.uiSoundsVolume);
}

function scheduleCue(audio: AudioContext, cue: UiSoundCue, volume: number): void {
  if (import.meta.env.DEV) {
    const debugWindow = window as Window & { __h2eqUiSoundCues?: string[] };
    (debugWindow.__h2eqUiSoundCues ??= []).push(cue);
  }
  const baseVolume = Math.min(0.35, Math.max(0, volume));
  const startAt = audio.currentTime + 0.008;
  for (const tone of CUES[cue]) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = startAt + tone.offset;
    const end = start + tone.duration;
    oscillator.type = tone.type ?? 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, baseVolume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.015);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
