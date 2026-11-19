import packJson from './hangout2-unit7-expanded-pack.json';
import type { Level } from '../../../types';

/**
 * Unit 7 reading passages live inline on the R2/R3/R4 slot entries. This
 * module collects them per level so checkpoint tap-sentence items can find
 * their passage without any component knowing which unit it belongs to.
 */

const pack = packJson as unknown as {
  levels: Record<Level, { content: Record<string, { passage?: string }> }>;
};

const PASSAGE_SLOTS = ['R2', 'R3', 'R4'] as const;

const TEXTS: Record<Level, string[]> = {
  easy: [],
  core: [],
  challenging: [],
};

for (const level of ['easy', 'core', 'challenging'] as Level[]) {
  const levelContent = pack.levels[level]?.content ?? pack.levels.core.content;
  for (const slot of PASSAGE_SLOTS) {
    const entry = levelContent[slot] ?? pack.levels.core.content[slot];
    if (entry?.passage) TEXTS[level].push(entry.passage);
  }
}

/**
 * Find which Unit 7 passage contains the given answer sentence. The
 * requested level is searched first; the other levels act as fallback
 * because the challenging R4 passage is a letter that reuses the level's
 * text, while some checkpoint tap answers quote the R4 season passage.
 */
export function findUnit7PassageContaining(level: Level, answer: string): string | undefined {
  const needle = answer.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
  const order: Level[] = [level, ...(['easy', 'core', 'challenging'] as Level[]).filter(l => l !== level)];
  for (const lvl of order) {
    for (const text of TEXTS[lvl]) {
      const flat = text.toLowerCase().replace(/[.,!?;:'"]/g, '');
      if (flat.includes(needle)) return text;
    }
  }
  return undefined;
}
