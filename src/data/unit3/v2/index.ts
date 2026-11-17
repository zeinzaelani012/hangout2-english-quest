import packJson from './hangout2-unit3-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, ActivityPayload, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 3 expanded pack (v2.0) — "My Favorite Food" / Cafe Island. Built
 * through the SAME shared merge engine as Units 1 and 2 (buildLevelFromPack):
 * slots joined to `levels[level].content[slot]` with the Core fallback, then
 * the D2 production transform. 32 activities per level = 30 content + CP1 +
 * BOSS. Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

export function buildLevel(level: Level): Activity[] {
  const acts = buildLevelFromPack(pack, level);
  // Review 1 (Units 1–3): append the pack's distractor contrasts to the Boss
  // pool as GapFill items, so the last unit of the review cycle tests the
  // cross-unit collisions (Do/Does, So/Neither do I, wears vs is wearing,
  // want vs wants, Does…taste good).
  return acts.map(a => {
    if (a.type !== 'boss') return a;
    const items: any[] = [...((a.payload as any).items ?? []), ...review1GapFillItems()];
    return { ...a, payload: { ...(a.payload as any), items } as ActivityPayload };
  });
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert each distractor contrast { a, b, answer, unit, context? } into a
 * GapFill item. The a/b strings stay verbatim as the two options; `answer`
 * is matched to its option by word boundary (exact for "So do I" pairs,
 * word-boundary for "Do" vs "Does" so "Does" never matches "Do").
 */
const review1GapFillItems = (): any[] =>
  ((pack as any).review1Connection?.distractorContrasts ?? []).map((c: any, i: number) => {
    const answerOption =
      [c.a, c.b].find(o => new RegExp(`\\b${escapeRe(c.answer)}\\b`).test(o)) ?? c.a;
    return {
      id: `boss-rc-${i + 1}`,
      sentence: c.context ? `${c.context} ___` : '___',
      instruction: c.context ? 'Choose the phrase that completes the sentence.' : 'Choose the correct sentence.',
      options: [c.a, c.b],
      answer: answerOption,
      why: `Review 1 contrast — the Unit ${c.unit} pattern.`,
    };
  });

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit3Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit3Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u3-` so they never collide
 * with Units 1–2 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u3-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** The Barbecue — role-play source for S5 (dialogueId in the S1–S7 slots). */
export const unit3Dialogue = (pack as any).dialogue as DialogueJSON;

/** Optional pronunciation card (ch vs sh vs th), Speaking station. */
export interface UnitPhonics {
  note?: string;
  note2?: string;
  contrast: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit3Phonics: UnitPhonics | undefined = (pack as any).phonics ?? undefined;
