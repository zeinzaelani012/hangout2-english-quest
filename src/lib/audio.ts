let audioCtx: SpeechSynthesis | null = null;

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  if (!audioCtx) audioCtx = window.speechSynthesis;
  return audioCtx;
}

const audioCache: Record<string, HTMLAudioElement> = {};

export function play(audioKey: string, fallbackText: string, rate: number = 0.9): void {
  // If an audio asset exists for this key, play it
  const assetPath = `/audio/${audioKey}.mp3`;
  if (audioCache[audioKey]) {
    audioCache[audioKey].play().catch(() => {
      synthesize(fallbackText, rate);
    });
    return;
  }

  // Try to load the asset — if it fails, synthesize
  const audio = new Audio(assetPath);
  audioCache[audioKey] = audio;
  audio.play().catch(() => {
    // Asset not found — synthesize
    delete audioCache[audioKey];
    synthesize(fallbackText, rate);
  });
}

function synthesize(text: string, rate: number = 0.9): void {
  const synth = getSynth();
  if (!synth) return;

  synth.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find an en-US voice
  const voices = synth.getVoices();
  const enVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;

  synth.speak(utterance);
}

export function stopAudio(): void {
  const synth = getSynth();
  if (synth) synth.cancel();
}

export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
