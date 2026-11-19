import packJson from './hangout2-unit9-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 9 expanded pack (v2.0) — "Our Field Trip" / Field Trip Island. Built
 * through the SAME shared merge engine as Units 1–8 (buildLevelFromPack):
 * slots joined to `levels[level].content[slot]` with the Core fallback, then
 * the D2 production transform. 32 activities per level = 30 content + CP1 +
 * BOSS. Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

export function buildLevel(level: Level): Activity[] {
  return buildLevelFromPack(pack, level);
}

/** Phase 7 can-do statements — Unit 9's pack ships none, so this is undefined
 * and the self-check screen falls back to generic statements. */
export const selfAssessment = (pack as any).selfAssessment ?? undefined;

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit9Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit9Stations: Station[] = ((pack as any).stations as {
  id: string;
  name: string;
  skill: string;
  order: number;
  subtitle?: string;
}[]).map(s => ({
  id: s.id,
  name: s.name,
  skill: (s.skill === 'mixed' ? 'speaking' : s.skill) as Skill,
  order: s.order,
  description: s.subtitle || '',
}));

/** Vocabulary bank entries — runtime ids prefixed `u9-` so they never collide
 * with Units 1–8 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u9-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** The Noise in the Grass — role-play source for S5 (three voices). */
export const unit9Dialogue = (pack as any).dialogue as DialogueJSON;

/**
 * Optional pronunciation card: the ch sound in two positions (beginning and
 * end of a word) — one sound, two placements, not a minimal-pair contrast.
 * The pack tags anchors/sort items with `position`; that normalizes to the
 * card's `sound` shape so the tags read "lunch (end)" / "cheese (beginning)"
 * — the where-is-the-sound framing the addendum asks for.
 */
export interface Unit9Phonics {
  note?: string;
  note2?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit9Phonics: Unit9Phonics | undefined = (pack as any).phonics
  ? {
      note: (pack as any).phonics.note,
      note2: (pack as any).phonics.note2,
      contrast: (pack as any).phonics.contrast,
      anchorWords: ((pack as any).phonics.anchorWords ?? []).map((a: any) => ({ word: a.word, sound: a.position ?? a.sound })),
      sortItems: ((pack as any).phonics.sortItems ?? []).map((s: any) => ({ word: s.word, sound: s.position ?? s.sound, note: s.note })),
    }
  : undefined;
