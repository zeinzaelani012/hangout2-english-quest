import packJson from './hangout2-unit6-expanded-pack.json';
import { buildLevelFromPack, type ExpandedPack } from '../../unit1/v2';
import type { DialogueJSON } from '../../unit1/contentPack';
import type { Activity, ActivityPayload, Level, Skill, Station, VocabItem } from '../../../types';

/**
 * Unit 6 expanded pack (v2.0) — "It's Hot!" / Weather Island. Built through
 * the SAME shared merge engine as Units 1–5 (buildLevelFromPack): slots
 * joined to `levels[level].content[slot]` with the Core fallback, then the D2
 * production transform. 32 activities per level = 30 content + CP1 + BOSS.
 * Nothing here hand-writes activities.
 */

const pack = packJson as unknown as ExpandedPack;

/**
 * Unit 6's BOSS ships a grouping item whose pairs come as `items: [{word,
 * bin}]` instead of the `words` + `answers` shape the checkpoint runner
 * normalizes. Convert it here, at the data layer, so the runner stays
 * untouched. Also normalizes the same shape anywhere in checkpoint pools.
 */
function normalizeGroupingItems(acts: Activity[]): Activity[] {
  return acts.map(a => {
    if (a.type !== 'boss' && a.type !== 'checkpoint' && a.type !== 'mixedRecall') return a;
    const items = (a.payload as any).items;
    if (!Array.isArray(items)) return a;
    const normalized = items.map((it: any) => {
      if (it.type !== 'grouping' || !Array.isArray(it.items) || it.words) return it;
      const answers: Record<string, string> = {};
      for (const g of it.items) answers[g.word] = g.bin;
      return { ...it, words: it.items.map((g: any) => g.word), answers };
    });
    return { ...a, payload: { ...(a.payload as any), items: normalized } as ActivityPayload };
  });
}

export function buildLevel(level: Level): Activity[] {
  return normalizeGroupingItems(buildLevelFromPack(pack, level));
}

/** Identity for the unit registry, straight from the pack's registry block. */
export const unit6Registry = {
  id: pack.meta.unit as number,
  title: (pack.meta as any).title as string,
  islandName: (pack.meta as any).islandName as string,
  bigQuestion: (pack.meta as any).bigQuestion as string,
  objectives: (pack.meta as any).objectives as string[],
  unlocked: true,
  status: 'playable' as const,
};

export const unit6Stations: Station[] = ((pack as any).stations as {
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

/** Vocabulary bank entries — runtime ids prefixed `u6-` so they never collide
 * with Units 1–5 in vocabMastery. The pack file stays verbatim. */
export const vocabulary: VocabItem[] = (pack as any).vocabulary.map((v: any) => ({
  id: `u6-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));

/** Brian's Raincoat — role-play source for S5 (three voices). */
export const unit6Dialogue = (pack as any).dialogue as DialogueJSON;

/**
 * Optional pronunciation card: the book's l-blend family (bl, cl, fl, gl, sl)
 * — five onset clusters rather than a two-sound contrast. Anchors and sort
 * items are normalized from the pack's `blend` tag to the card's `sound`
 * shape, so the card renders them as a list with audio (never forced into
 * two bins).
 */
export interface Unit6Phonics {
  note?: string;
  note2?: string;
  contrast: string[];
  blends?: string[];
  anchorWords: { word: string; sound: string }[];
  sortItems: { word: string; sound: string; note?: string }[];
}

export const unit6Phonics: Unit6Phonics | undefined = (pack as any).phonics
  ? {
      note: (pack as any).phonics.note,
      note2: (pack as any).phonics.note2,
      contrast: (pack as any).phonics.contrast,
      blends: (pack as any).phonics.blends,
      anchorWords: ((pack as any).phonics.anchorWords ?? []).map((a: any) => ({ word: a.word, sound: a.blend })),
      sortItems: ((pack as any).phonics.sortItems ?? []).map((s: any) => ({ word: s.word, sound: s.blend, note: s.note })),
    }
  : undefined;
