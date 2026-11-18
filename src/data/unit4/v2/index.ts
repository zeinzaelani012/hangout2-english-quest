import packJson from './hangout2-unit4-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 4 expanded pack (v2.0) — "My Classes" / Timetable Island. Built
 * through the SAME shared merge engine as Units 1–3 (buildLevelFromPack):
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
export const unit4Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit4Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u4-` so they never collide
 * with Units 1–3 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u4-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** Where Is My Calculator? — role-play source for S5. */
export const unit4Dialogue = (pack as any).dialogue as DialogueJSON;

/** Unit 4 ships the full ritual layer (mission brief, teach cards, reflection). */
export const unit4Ritual = (pack as any).ritual ?? undefined;

/** Optional pronunciation card (s vs sh), Speaking station. */
export interface UnitPhonics {
  note?: string;
  note2?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit4Phonics: UnitPhonics | undefined = (pack as any).phonics ?? undefined;
