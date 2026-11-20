// Shared text normalisation for audio keying. This must match
// scripts/build-audio-manifest.mjs exactly: trim, collapse whitespace,
// straighten curly quotes, ensure terminal punctuation.

export function normaliseText(text: string): string {
  let t = String(text ?? '').trim().replace(/\s+/g, ' ');
  t = t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  if (/[a-z0-9]$/i.test(t)) t += '.';
  return t;
}
