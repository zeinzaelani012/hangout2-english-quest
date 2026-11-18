import packJson from './hangout2-unit1-expanded-pack.json';
import { readingTexts } from '../reading';
import { findUnit2PassageContaining } from '../../unit2/v2/passages';
import { findUnit3PassageContaining } from '../../unit3/v2/passages';
import { findUnit4PassageContaining } from '../../unit4/v2/passages';
import { findUnit5PassageContaining } from '../../unit5/v2/passages';
import { findUnit6PassageContaining } from '../../unit6/v2/passages';
import type { Activity, ActivityPayload, ActivityType, DepthMove, Level, Skill } from '../../../types';

/**
 * Unit 1 expanded pack (v2.0) — supersedes the old generated Unit 1 levels.
 *
 * Merge contract (from the pack's meta.mergeContract): every slot in `slots`
 * is joined to `levels[level].content[slot]` for its prompt + items; a slot
 * missing from a level inherits the Core entry. The resulting activity is
 * { id: slot-level, skill, type, prompt, payload: full slot entry, xp,
 *   estSeconds, depthMoves, schema: 2 }.
 *
 * CP1 and BOSS are checkpoint slots: they are returned by buildLevel (they are
 * part of the level's timeline and pacing) but are NOT part of the 30 content
 * activities.
 */

export interface PackSlot {
  slot: string;
  skill: Skill | 'mixed';
  type: string;
  estSeconds: number;
  xp: number;
  depthMoves: DepthMove[];
  station: string;
  label: string;
}

/** A level's content entry: prompt plus mechanic-specific keys (items, bins, …). */
export type PackEntry = Record<string, any>;

export interface PackLevel {
  content: Record<string, PackEntry>;
}

/** Ritual layer content (mission brief, teach-card stations, reflection). */
export interface PackRitual {
  missionBrief?: { seconds?: number; content?: string };
  stationTeachCards?: { seconds?: number; applies?: string[] };
  reflection?: { seconds?: number; prompts?: string[] };
}

export interface ExpandedPack {
  meta: { unit: number; [key: string]: unknown };
  slots: PackSlot[];
  levels: {
    easy: PackLevel;
    core: PackLevel;
    challenging: PackLevel;
  };
  ritual?: PackRitual;
}

const pack = packJson as unknown as ExpandedPack;

/** Ritual layer content for Unit 1 (mission brief, teach cards, reflection). */
export const unit1Ritual: PackRitual = pack.ritual ?? {};

/**
 * The shared v2 merge engine. Every expanded pack (Units 1, 2, 4, …) builds
 * its levels through this one function: slots joined to
 * `levels[level].content[slot]` with the Core fallback, then the D2
 * production transform. No pack ever hand-writes activities.
 */
export function buildLevelFromPack(sourcePack: ExpandedPack, level: Level): Activity[] {
  const levelContent = sourcePack.levels[level].content;
  const coreContent = sourcePack.levels.core.content;

  const activities = sourcePack.slots.map(slot => {
    // Slots missing from this level inherit the Core entry (merge contract).
    const entry = levelContent[slot.slot] ?? coreContent[slot.slot];

    return {
      id: `${slot.slot}-${level}`,
      // Keep the pack's own skill: checkpoint slots stay 'mixed' so the
      // pacing engine splits them out of the level multiplier.
      skill: slot.skill as Skill | 'mixed',
      type: slot.type as ActivityType,
      prompt: (entry.prompt as string) ?? '',
      // The payload carries the FULL slot entry so mechanics receive their
      // spec'd props (items, bins, passes, teachCard, textRef, passage, …).
      payload: { ...entry, unitId: sourcePack.meta.unit } as unknown as ActivityPayload,
      xp: slot.xp,
      estSeconds: slot.estSeconds,
      depthMoves: slot.depthMoves,
      schema: 2 as const,
      difficulty: level,
      unitId: sourcePack.meta.unit,
    } satisfies Activity;
  });

  return applyD2(sourcePack, activities);
}

export function buildLevel(level: Level): Activity[] {
  return buildLevelFromPack(pack, level);
}

/** Phase 7 can-do statements for this unit, injected verbatim from the pack. */
export const selfAssessment = (pack as any).selfAssessment ?? undefined;

/**
 * D2 — produce instead of recognise. Declared per slot via depthMoves.
 * (a) A D2 slot that is production-with-scaffold (spelling letter banks,
 *     sentence-builder word banks) becomes pure typed production: no letter
 *     hints, no word bank, same content. Already-pure-production slots
 *     (sentenceRepair, guidedParagraph) are unchanged.
 * (b) In any station whose slots declare D2, the station's last item becomes
 *     a production prompt: typed for word answers, speaking for sentences —
 *     same stimulus (image/audio), same answer.
 */
function applyD2(sourcePack: ExpandedPack, acts: Activity[]): Activity[] {
  const out = acts.map((activity, i) => {
    const slot = sourcePack.slots[i];
    if (!slot.depthMoves?.includes('D2')) return activity;
    const items = (activity.payload as any)?.items;
    if (activity.type === 'spelling' && Array.isArray(items)) {
      return {
        ...activity,
        type: 'typeIt' as ActivityType,
        payload: {
          items: items.map((it: any) => ({
            id: it.id,
            prompt: 'Type the word you hear.',
            audio: it.audio,
            answer: it.answer,
          })),
        } as unknown as ActivityPayload,
      };
    }
    if (activity.type === 'sentenceBuilder' && Array.isArray(items)) {
      return {
        ...activity,
        type: 'typeIt' as ActivityType,
        payload: {
          items: items.map((it: any) => ({
            id: it.id,
            prompt: 'Type the sentence. Punctuation counts.',
            answer: it.answer,
          })),
        } as unknown as ActivityPayload,
      };
    }
    return activity;
  });

  // (b) The last item of every station that declares D2.
  const d2Stations = new Set(
    sourcePack.slots.filter(s => s.depthMoves?.includes('D2')).map(s => s.station),
  );
  const lastIndexOfStation = new Map<string, number>();
  sourcePack.slots.forEach((s, i) => lastIndexOfStation.set(s.station, i));

  for (const stationName of d2Stations) {
    const idx = lastIndexOfStation.get(stationName);
    if (idx === undefined) continue;
    const activity = out[idx];
    const items = (activity?.payload as any)?.items;
    // guidedParagraph (writing) has no items — it is already free production.
    if (!activity || !Array.isArray(items) || items.length === 0) continue;
    const lastIdx = items.length - 1;
    const last = items[lastIdx];
    const alreadyProduced =
      last.type === 'typeIt' || last.type === 'sentenceRepair' || last.type === 'speaking';
    if (alreadyProduced || !last.answer) continue;

    const wordCount = String(last.answer).trim().split(/\s+/).length;
    const nextItems = items.slice();
    if (wordCount <= 3) {
      nextItems[lastIdx] = {
        id: last.id,
        type: 'typeIt',
        img: last.img,
        audio: last.audio,
        prompt: last.img
          ? 'Type the word for the picture.'
          : last.audio
            ? 'Type the word you hear.'
            : 'Type your answer.',
        answer: last.answer,
      };
    } else {
      nextItems[lastIdx] = {
        id: last.id,
        type: 'speaking',
        q: last.q ?? 'Say the answer in a full sentence.',
        keywords: String(last.answer)
          .toLowerCase()
          .replace(/[.,!?;:'"]/g, '')
          .split(/\s+/)
          .filter(Boolean),
      };
    }
    out[idx] = {
      ...activity,
      payload: { ...(activity.payload as any), items: nextItems } as ActivityPayload,
    };
  }

  return out;
}

// ---- Reading passage resolution ---------------------------------------------
// R2/R3/R4 carry a textRef like "readings.snackDiary.core"; boss tap-sentence
// items carry none, so their passage is found by searching the level's texts.

const TEXT_REF_RE = /readings\.(\w+)\.(easy|core|challenging)/;

// textRef names → reading titles in the base pack's readingTexts array.
const READING_BY_REF: Record<string, string> = {
  snackDiary: 'My Snack Diary',
  whereFruitGrows: 'Where Does Fruit Grow?',
};

export function resolvePassage(textRef: string | undefined): string | undefined {
  if (!textRef) return undefined;
  const m = TEXT_REF_RE.exec(textRef);
  if (!m) return undefined;
  const title = READING_BY_REF[m[1]];
  const reading = readingTexts.find(r => r.title === title) as any;
  const levelText = reading?.[m[2]]?.text;
  return typeof levelText === 'string' ? levelText : undefined;
}

/** Display title for a textRef, e.g. "My Snack Diary". */
export function resolveReadingTitle(textRef: string | undefined): string | undefined {
  if (!textRef) return undefined;
  const m = TEXT_REF_RE.exec(textRef);
  return m ? READING_BY_REF[m[1]] : undefined;
}

/** Find which of the level's texts contains the given answer sentence.
 * Searches Unit 1's base-pack readings, then any other expanded pack's inline
 * passages (Unit 2 carries its R2/R3/R4 passages inline), so checkpoint
 * tap-sentence items resolve without the component knowing the unit. */
export function findPassageContaining(level: Level, answer: string): string | undefined {
  const needle = answer.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
  for (const reading of readingTexts as any[]) {
    const text: string | undefined = reading[level]?.text;
    if (typeof text === 'string') {
      const flat = text.toLowerCase().replace(/[.,!?;:'"]/g, '');
      if (flat.includes(needle)) return text;
    }
  }
  return findUnit2PassageContaining(level, answer) ?? findUnit3PassageContaining(level, answer) ?? findUnit4PassageContaining(level, answer) ?? findUnit5PassageContaining(level, answer) ?? findUnit6PassageContaining(level, answer);
}
