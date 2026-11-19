import packJson from './hangout2-unit7-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 7 expanded pack (v2.0) — "The Four Seasons" / Four Seasons Island.
 * Built through the SAME shared merge engine as Units 1–6
 * (buildLevelFromPack): slots joined to `levels[level].content[slot]` with
 * the Core fallback, then the D2 production transform. 32 activities per
 * level = 30 content + CP1 + BOSS. Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

export function buildLevel(level: Level): Activity[] {
  return buildLevelFromPack(pack, level);
}

/** Phase 7 can-do statements for this unit, injected verbatim into the pack. */
export const selfAssessment = (pack as any).selfAssessment ?? undefined;

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit7Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit7Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u7-` so they never collide
 * with Units 1–6 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u7-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** Snowball Tennis — role-play source for S5 (two voices). */
export const unit7Dialogue = (pack as any).dialogue as DialogueJSON;

/**
 * Optional pronunciation card: the book's -ing ending — a single ending, not
 * a two-sound contrast. The pack tags anchors/sort items with `note`; those
 * are normalized to the card's `sound` shape so the card renders them as a
 * plain list with audio.
 */
export interface Unit7Phonics {
  note?: string;
  note2?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit7Phonics: Unit7Phonics | undefined = (pack as any).phonics
  ? {
      note: (pack as any).phonics.note,
      note2: (pack as any).phonics.note2,
      contrast: (pack as any).phonics.contrast,
      anchorWords: ((pack as any).phonics.anchorWords ?? []).map((a: any) => ({ word: a.word, sound: a.note ?? a.sound ?? a.blend })),
      sortItems: ((pack as any).phonics.sortItems ?? []).map((s: any) => ({ word: s.word, sound: s.note ?? s.sound ?? s.blend, note: s.note })),
    }
  : undefined;
