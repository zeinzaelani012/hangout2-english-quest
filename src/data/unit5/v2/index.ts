import packJson from './hangout2-unit5-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 5 expanded pack (v2.0) — "Finding Things" / Lost & Found Island. Built
 * through the SAME shared merge engine as Units 1–4 (buildLevelFromPack):
 * slots joined to `levels[level].content[slot]` with the Core fallback, then
 * the D2 production transform. 32 activities per level = 30 content + CP1 +
 * BOSS. Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

export function buildLevel(level: Level): Activity[] {
  return buildLevelFromPack(pack, level);
}

/** Phase 7 can-do statements for this unit, injected verbatim from the pack. */
export const selfAssessment = (pack as any).selfAssessment ?? undefined;

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit5Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit5Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u5-` so they never collide
 * with Units 1–4 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u5-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** Where Is My Toothbrush? — role-play source for S5 (three voices). */
export const unit5Dialogue = (pack as any).dialogue as DialogueJSON;

/** Optional pronunciation card (r vs l), Speaking station. */
export interface UnitPhonics {
  note?: string;
  note2?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit5Phonics: UnitPhonics | undefined = (pack as any).phonics ?? undefined;
