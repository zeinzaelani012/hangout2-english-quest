// Voice discovery, vendor detection, grouping, ranking and the picker
// contract. Exactly one source of voices: speechSynthesis.getVoices() —
// no provider APIs, no keys, no network calls.

export interface VoiceGroup {
  vendor: 'microsoft' | 'google' | 'apple' | 'system';
  label: string;
  voices: SpeechSynthesisVoice[];
}

export function getVoicesList(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

/** Fires immediately and on every voiceschanged until unsubscribed. Chrome
 * can fire voiceschanged more than once — callers debounce by comparing the
 * voiceURI list. */
export function onVoicesChanged(cb: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {};
  const synth = window.speechSynthesis;
  const handler = () => cb();
  synth.addEventListener('voiceschanged', handler);
  // Some engines never fire the event but populate asynchronously.
  const poll = window.setInterval(() => cb(), 500);
  const stop = window.setTimeout(() => window.clearInterval(poll), 4000);
  cb();
  return () => {
    synth.removeEventListener('voiceschanged', handler);
    window.clearInterval(poll);
    window.clearTimeout(stop);
  };
}

export function vendorOf(v: SpeechSynthesisVoice): VoiceGroup['vendor'] {
  const n = v.name.toLowerCase();
  if (n.includes('microsoft')) return 'microsoft';
  if (n.includes('google')) return 'google';
  if (n.includes('apple') || /^(samantha|daniel|karen|moira|tessa|alex|fred|amelie)\b/.test(n)) return 'apple';
  return 'system';
}

const GROUP_ORDER: { vendor: VoiceGroup['vendor']; label: string }[] = [
  { vendor: 'microsoft', label: 'Microsoft' },
  { vendor: 'google', label: 'Google' },
  { vendor: 'apple', label: 'Apple' },
  { vendor: 'system', label: 'Other' },
];

export function isNeural(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return n.includes('natural') || n.includes('online');
}

export function isEnglish(v: SpeechSynthesisVoice): boolean {
  return v.lang.toLowerCase().startsWith('en');
}

export function groupVoices(voices: SpeechSynthesisVoice[]): VoiceGroup[] {
  const groups = GROUP_ORDER.map(g => ({ ...g, voices: [] as SpeechSynthesisVoice[] }));
  const byVendor = new Map(groups.map(g => [g.vendor, g]));
  for (const v of voices) byVendor.get(vendorOf(v))?.voices.push(v);
  for (const g of groups) {
    g.voices.sort((a, b) => {
      const na = isNeural(a) ? 0 : 1;
      const nb = isNeural(b) ? 0 : 1;
      if (na !== nb) return na - nb;
      const la = a.localService ? 0 : 1;
      const lb = b.localService ? 0 : 1;
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name);
    });
  }
  return groups.filter(g => g.voices.length > 0);
}

/** F6 — pick the best available voice automatically when nothing is saved. */
export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter(isEnglish);
  const pool = en.length > 0 ? en : voices;
  const by = (pred: (v: SpeechSynthesisVoice) => boolean) => pool.find(pred) ?? null;
  return (
    by(v => vendorOf(v) === 'microsoft' && isNeural(v)) ??
    by(v => vendorOf(v) === 'microsoft' && v.name.includes('English (United States)')) ??
    by(v => vendorOf(v) === 'google' && /US English|UK English Female/.test(v.name)) ??
    by(v => vendorOf(v) === 'google' && isEnglish(v)) ??
    by(v => vendorOf(v) === 'apple' && /^(samantha|karen|moira|tessa|daniel)\b/i.test(v.name)) ??
    pool[0] ??
    null
  );
}

export function resolveVoice(uri: string | null | undefined, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!uri) return null;
  return voices.find(v => v.voiceURI === uri) ?? null;
}

export function languageName(lang: string): string {
  const map: Record<string, string> = {
    en: 'English',
    'en-us': 'English (United States)',
    'en-gb': 'English (United Kingdom)',
    'en-au': 'English (Australia)',
    'en-in': 'English (India)',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    mn: 'Mongolian',
  };
  const base = lang.toLowerCase().split(/[-_]/)[0];
  return map[lang.toLowerCase()] ?? map[base] ?? lang;
}
