// Persisted audio settings — localStorage key `h2eq.audio.v1`.
// Read synchronously at app start so the first clip is never spoken in the
// wrong voice and then switched.

export interface AudioSettings {
  /** speechSynthesis voiceURI — keyed, not named. */
  voiceURI: string | null;
  /** Kept only so the UI can say which voice is missing when it can't be re-resolved. */
  voiceName: string | null;
  /** Base rate multiplier (1.0 = normal). */
  rate: number;
  /** Global volume, 0–1, default 80%. Never above 1. */
  volume: number;
  /** Give one dialogue character a different voice. */
  characterVoices: boolean;
  /** The second voice, used only when characterVoices is true. */
  characterVoiceURI: string | null;
  /** Teacher lock (F8): learners see the picker read-only. */
  voiceLocked: boolean;
}

const KEY = 'h2eq.audio.v1';

const DEFAULTS: AudioSettings = {
  voiceURI: null,
  voiceName: null,
  rate: 1.0,
  volume: 0.8,
  characterVoices: false,
  characterVoiceURI: null,
  voiceLocked: false,
};

let cached: AudioSettings | null = null;
const listeners = new Set<() => void>();

export function loadAudioSettings(): AudioSettings {
  const preloaded = cached;
  if (preloaded !== null) return preloaded;
  let loaded: AudioSettings = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) loaded = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    loaded = { ...DEFAULTS };
  }
  cached = loaded;
  return loaded;
}

export function saveAudioSettings(partial: Partial<AudioSettings>): AudioSettings {
  const next = { ...loadAudioSettings(), ...partial };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — keep in-memory */
  }
  cached = next;
  for (const cb of listeners) cb();
  return next;
}

export function onAudioSettingsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetAudioSettingsCache(): void {
  cached = null;
}
