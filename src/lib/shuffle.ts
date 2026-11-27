// Deterministic option order.
//
// The packs were authored with the correct answer first in ~95% of choice
// items, so option lists must be reordered at render time. The seed keeps the
// order stable for a given item across re-renders (no reshuffle mid-question)
// while items, stations and units each get their own order.

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  // FNV-1a, then a murmur3-style finaliser so consecutive ids diverge.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;

  // mulberry32
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
