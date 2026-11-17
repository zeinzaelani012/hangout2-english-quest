import packJson from './hangout2-unit2-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 2 expanded pack (v2.0) — "My Clothes" / Wardrobe Island. Built through
 * the SAME shared merge engine as Units 1 and 4 (buildLevelFromPack): slots
 * joined to `levels[level].content[slot]` with the Core fallback, then the D2
 * production transform. 32 activities per level = 30 content + CP1 + BOSS.
 * Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

export function buildLevel(level: Level): Activity[] {
  return buildLevelFromPack(pack, level);
}

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit2Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit2Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u2-` so they never collide
 * with Unit 1's ids in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u2-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** The Sweatshirt — role-play source for S5 (dialogueId in the S1–S7 slots). */
export const unit2Dialogue = (pack as any).dialogue as DialogueJSON;

/** Optional pronunciation card (th vs s), surfaced inside the Speaking station. */
export interface UnitPhonics {
  note?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit2Phonics: UnitPhonics | undefined = (pack as any).phonics ?? undefined;
