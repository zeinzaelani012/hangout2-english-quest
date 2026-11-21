// PHASE 10 — the single normalisation module, used by TAP_SENTENCE,
// TYPED_ANSWER, TILE_SEQUENCE (SentenceBuilder) and SORT_BINS. This is the
// most important file in the phase: wrong here, and every reading station
// silently mis-marks.
//
// The rules that matter:
//   - A colon or semicolon NEVER ends a sentence — nine real pack answers
//     contain one ("Watermelons stay on the ground: they are too heavy…").
//   - "2,000" stays "2,000" — thousands commas inside a number are part of
//     the word, and the rendered sentence still shows them.
//   - "doesn't" stays "doesn't" — apostrophes are never stripped.

/**
 * Split a passage into tappable sentence units.
 *   → split on [.!?] followed by whitespace ONLY — never on : ; , or —
 *   → never split inside a number: a period between digits ("3.5") and a
 *     thousands comma ("2,000") are part of the word
 *   → trim each sentence and drop empties; original order, never reordered
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let current = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    current += ch;
    const isTerminal = ch === '.' || ch === '!' || ch === '?';
    if (!isTerminal) continue;
    // Number guard: a period BETWEEN digits ("3.5") is not a boundary even
    // if degenerate whitespace follows.
    const prev = chars[i - 1];
    if (ch === '.' && /\d/.test(prev ?? '') && /\d/.test(chars[i + 1] ?? '')) continue;
    // Boundary only when terminal punctuation is followed by whitespace and
    // the next non-space character starts a new unit.
    let j = i + 1;
    while (j < chars.length && /\s/.test(chars[j])) j++;
    if (j > i + 1 || j === chars.length) {
      const piece = current.trim();
      if (piece) out.push(piece);
      current = '';
      i = j - 1;
    }
  }
  const rest = current.trim();
  if (rest) out.push(rest);
  return out;
}

/**
 * Normalise a string for MATCHING (never for display):
 *   → trim, collapse whitespace
 *   → straighten curly quotes and apostrophes, unify dashes
 *   → strip ONE trailing full stop (packs vary on it)
 *   → lowercase
 *   → PRESERVE digits exactly, including thousands commas ("2,000")
 *   → PRESERVE apostrophes ("doesn't" stays "doesn't")
 *   → do NOT strip internal commas, colons or semicolons
 */
export function normaliseForMatch(text: string): string {
  let t = String(text ?? '')
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  // One trailing full stop — statement intonation, not content.
  t = t.replace(/\.+$/, '');
  return t;
}

/**
 * Damerau-Levenshtein distance: insertion, deletion, substitution OR
 * transposition of two adjacent characters. Used by TYPED_ANSWER's
 * `allowOneLetterTypo` (distance ≤ 1, never for answers under 4 characters).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const alen = a.length;
  const blen = b.length;
  // d holds the full matrix; small strings only (answers, not passages).
  const d: number[][] = Array.from({ length: alen + 1 }, () => new Array<number>(blen + 1).fill(0));
  for (let i = 0; i <= alen; i++) d[i][0] = i;
  for (let j = 0; j <= blen; j++) d[0][j] = j;
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
      if (
        i > 1 && j > 1 &&
        a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return d[alen][blen];
}

/** Spell a word out letter by letter for the "close enough" line: s-c-h-o-o-l. */
export function spelledOut(word: string): string {
  return [...word].join('-');
}
