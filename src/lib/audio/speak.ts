// Tier 0 — the speechSynthesis wrapper. The only place a Voice object is
// used. Handles iOS (voices load async; first utterance needs a gesture),
// Chrome's ~15 s utterance truncation (split into <=180-char chunks) and
// total cancellation.

import { loadAudioSettings } from './settings';

export interface SpeakOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  volume?: number;
  pitch?: number;
}

const MAX_CHUNK = 180;
const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

// iOS gate: the FIRST utterance must come from a user gesture. If play() is
// called without one, the request is queued and flushed on the next
// pointerdown — never swallowed silently.
let gestureSeen = false;
const pendingUtterances: (() => void)[] = [];

if (typeof window !== 'undefined') {
  const unlock = () => {
    gestureSeen = true;
    const queue = pendingUtterances.splice(0);
    for (const run of queue) run();
  };
  window.addEventListener('pointerdown', unlock, { once: false });
}

function needsGesture(): boolean {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document);
  return isIOS && !gestureSeen;
}

/** Split at sentence boundaries into chunks of at most MAX_CHUNK chars. */
export function chunkForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    const piece = s.trim();
    if (!piece) continue;
    if (piece.length > MAX_CHUNK) {
      // A single very long sentence: hard-split on word boundaries.
      if (current) chunks.push(current.trim());
      for (const word of piece.split(/\s+/)) {
        if ((current + ' ' + word).trim().length > MAX_CHUNK) {
          if (current) chunks.push(current.trim());
          current = word;
        } else {
          current = (current + ' ' + word).trim();
        }
      }
      continue;
    }
    if ((current + ' ' + piece).trim().length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = piece;
    } else {
      current = (current + ' ' + piece).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, MAX_CHUNK)];
}

let activeUtterances: SpeechSynthesisUtterance[] = [];

export function cancelSpeech(): void {
  synth()?.cancel();
  activeUtterances = [];
}

export function isSpeechSpeaking(): boolean {
  return synth()?.speaking ?? false;
}

/**
 * Speak text through speechSynthesis. Resolves when the last chunk finishes,
 * rejects on failure. A user-requested stop resolves (not a failure).
 */
export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const synthApi = synth();
  if (!synthApi) return Promise.reject(new Error('speechSynthesis unavailable'));

  const run = (): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const settings = loadAudioSettings();
      const chunks = chunkForSpeech(text);
      const queue = chunks.map((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        if (opts.voice) u.voice = opts.voice;
        u.lang = opts.voice?.lang ?? 'en-US';
        u.rate = Math.max(0.1, Math.min(3, (opts.rate ?? 1) * settings.rate));
        u.volume = Math.max(0, Math.min(1, opts.volume ?? settings.volume));
        u.pitch = Math.max(0, Math.min(2, opts.pitch ?? 1));
        u.onend = () => {
          if (i === chunks.length - 1) resolve();
        };
        u.onerror = ev => {
          if (ev.error === 'interrupted' || ev.error === 'canceled') resolve();
          else reject(new Error(`speechSynthesis: ${ev.error}`));
        };
        return u;
      });
      activeUtterances = queue;
      synthApi.cancel();
      for (const u of queue) synthApi.speak(u);
    });

  if (needsGesture()) {
    return new Promise<void>((resolve, reject) => {
      pendingUtterances.push(() => {
        run().then(resolve, reject);
      });
    });
  }
  return run();
}
