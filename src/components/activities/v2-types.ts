/**
 * Shared helpers for the v2 (expanded pack) activity mechanics.
 * Every v2 mechanic component receives the full slot entry as its payload
 * and pulls `items` (or its mechanic-specific keys) from it.
 *
 * PHASE 10 — normalisation and sentence splitting live in ONE shared module
 * (src/lib/normalise.ts) used by TAP_SENTENCE, TYPED_ANSWER, TILE_SEQUENCE
 * and SORT_BINS. This file re-exports them so existing imports keep working.
 */

import { normaliseForMatch } from '../../lib/normalise';

export type ItemResult = (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;

/** v2 payloads are slot entries; multi-item mechanics keep their array in `items`. */
export function v2Items<T = Record<string, any>>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const items = (payload as Record<string, any> | undefined)?.items;
  if (Array.isArray(items)) return items as T[];
  return [];
}

/**
 * Activity-level pass rule, matching DragSort's precedent: all correct, or
 * fewer than half wrong.
 */
export function majorityCorrect(results: boolean[]): boolean {
  if (results.length === 0) return true;
  const wrong = results.filter(r => !r).length;
  return results.every(Boolean) || wrong < results.length / 2;
}

/**
 * Legacy punctuation-insensitive normalise: everything normaliseForMatch
 * does, then strips remaining punctuation. Used where callers compare
 * content words regardless of punctuation (TapToken's wrong-word match,
 * TypedAnswer's word diff).
 */
export function normalizeSentence(s: string): string {
  return normaliseForMatch(s)
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tap-sentence matching. The pack's answers are sometimes a clause inside a
 * longer text sentence, or a quote that sentence-splitting breaks in two, so
 * exact equality is not enough: accept a tapped sentence that contains the
 * answer, or carries most of it — but never a tiny fragment. Last resort:
 * punctuation-insensitive equality, so a comma drift between a pack answer
 * and the passage text never mis-marks a correct tap.
 */
export function sentenceMatches(tapped: string, answer: string): boolean {
  const a = normaliseForMatch(tapped);
  const b = normaliseForMatch(answer);
  if (!a || !b) return false;
  if (a === b) return true;
  // The tapped (whole) sentence contains the answer clause — always correct.
  if (a.includes(b)) return true;
  // The answer spans two split units ("…? he asks."); only accept a tapped
  // piece that carries most of it — never a tiny fragment like "he asks".
  if (b.includes(a)) return a.length >= b.length * 0.5;
  const strip = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  return strip(a) === strip(b);
}

/** Split a passage into tappable sentence units — the shared module's
 * colon/semicolon/figure-safe implementation. */
export { splitSentences } from '../../lib/normalise';

/** Render a stem that contains ___ or ___(n)___ gaps, replacing them with blanks. */
export function renderStemParts(stem: string): (string | 'blank')[] {
  const parts: (string | 'blank')[] = [];
  const regex = /___\(\d+\)___|___/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(stem)) !== null) {
    if (m.index > last) parts.push(stem.slice(last, m.index));
    parts.push('blank');
    last = m.index + m[0].length;
  }
  if (last < stem.length) parts.push(stem.slice(last));
  return parts;
}
