// Typed access to the capstone pack, plus the adapter that turns capstone
// items into the Activity shape the existing mechanics already accept. The
// adapter exists so the 18 stations reuse the course's own components — the
// differences (no teach card, no hint, no per-item why mid-station) are
// enforced HERE, not in each component.

import packJson from './hangout2-capstone-pack.json';
import type { Activity, ActivityType, Skill } from '../../types';

// ── Pack types ────────────────────────────────────────────────────────────────

export interface CapstoneItem {
  id: string;
  type: string;
  unit?: number;
  skill?: Skill;
  // choice items
  img?: string;
  word?: string;
  words?: string[];
  options?: string[];
  answer: string;
  sentence?: string;
  q?: string;
  audio?: string;
  replayLimit?: number;
  // error correction
  wrong?: string;
  correct?: string;
  why?: string;
  // builder
  tiles?: string[];
  // tap sentence
  answerType?: string;
  // writing
  prompt?: string;
  minimumWords?: number;
  checklist?: string[];
  // speaking
  keywords?: string[];
  minimumSeconds?: number;
}

export interface CapstoneStation {
  id: string;
  skill: Skill;
  title: string;
  prompt: string;
  estSeconds: number;
  xp: number;
  replayLimit?: number;
  passage?: string;
  items: CapstoneItem[];
}

export interface CapstoneSeal {
  id: string;
  title: string;
  prompt: string;
  passMark: number;
  of: number;
  items: CapstoneItem[];
}

export interface CapstoneIsland {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  units: number[];
  unitTitles: string[];
  stations: CapstoneStation[];
  seal: CapstoneSeal;
}

export interface CapstoneFinalGate {
  id: string;
  title: string;
  prompt: string;
  estSeconds: number;
  xp: number;
  itemCount: number;
  composition: Record<string, number>;
  noTimer: boolean;
  items: CapstoneItem[];
}

interface CapstonePack {
  meta: Record<string, any>;
  skillOrder: string[];
  skillLabels: Record<string, string>;
  islands: CapstoneIsland[];
  finalGate: CapstoneFinalGate;
  certificate: Record<string, any>;
  unlockRules: Record<string, any>;
}

const pack = packJson as unknown as CapstonePack;

export const capstoneMeta = pack.meta;
export const capstoneSkillOrder = pack.skillOrder as Skill[];
export const capstoneSkillLabels = pack.skillLabels;
export const capstoneIslands: CapstoneIsland[] = pack.islands;
export const capstoneFinalGate = pack.finalGate;
export const capstoneCertificate = pack.certificate;
export const capstoneUnlockRules = pack.unlockRules;

export const CAPSTONE_STATION_COUNT = pack.islands.reduce((n, i) => n + i.stations.length, 0);

export function capstoneIsland(islandId: string): CapstoneIsland | undefined {
  return pack.islands.find(i => i.id === islandId);
}

export function capstoneStation(islandId: string, stationId: string): CapstoneStation | undefined {
  return capstoneIsland(islandId)?.stations.find(s => s.id === stationId);
}

export function capstoneSeal(islandId: string): CapstoneSeal | undefined {
  return capstoneIsland(islandId)?.seal;
}

export function allCapstoneStations(): Array<{ island: CapstoneIsland; station: CapstoneStation }> {
  return pack.islands.flatMap(island => island.stations.map(station => ({ island, station })));
}

// ── Item → Activity adapter ───────────────────────────────────────────────────

/**
 * Map a capstone item type onto an ActivityType the course already renders.
 * `shortResponse` has no existing mechanic — the runner renders it itself.
 */
const TYPE_MAP: Record<string, ActivityType | 'shortResponse'> = {
  pictureToWord: 'pictureToWord',
  wordToPicture: 'wordToPicture',
  gapFill: 'gapFill',
  oddOneOut: 'oddOneOut',
  audioToWord: 'audioToWord',
  audioQuestion: 'audioQuestion',
  errorCorrection: 'errorCorrection',
  sentenceBuilder: 'sentenceBuilder',
  sentenceRepair: 'sentenceRepair',
  gist: 'gist',
  detail: 'detail',
  tapSentence: 'findSentence',
  personalResponse: 'personalResponse',
  monologue: 'monologue',
  shortResponse: 'shortResponse',
};

export interface AdaptedItem {
  item: CapstoneItem;
  /** Activity for the existing mechanic, or null for shortResponse (runner-owned). */
  activity: Activity | null;
}

/**
 * Wrap one capstone item as a single-item Activity. `forReview` keeps the
 * item's `why` so the review step can show it — mid-station the why is
 * always stripped (Part C rule 2). Choice items go through GapFill, whose
 * D1 reason-chip layer only activates when `whyChoices` exists — it never
 * does here.
 */
export function adaptCapstoneItem(item: CapstoneItem, opts: { forReview?: boolean; level?: 'easy' | 'core' | 'challenging' } = {}): AdaptedItem {
  const type = TYPE_MAP[item.type] ?? 'gapFill';
  const stripWhy = !opts.forReview;
  const clean: Record<string, any> = { ...item };
  if (stripWhy) delete clean.why;
  if (type === 'personalResponse' || type === 'monologue') {
    clean.items = [{ q: item.q, keywords: item.keywords ?? [], model: undefined }];
    clean.selfCheck = ['I answered in a full sentence', 'I said it clearly and loudly', 'I did not stop in the middle'];
    if (type === 'monologue') clean.minimumSeconds = item.minimumSeconds ?? 25;
    clean.keywords = item.keywords ?? [];
    delete clean.q;
  } else {
    clean.items = [clean];
  }
  const activity: Activity = {
    id: item.id,
    skill: (item.skill ?? 'vocabulary') as Skill,
    type: type === 'shortResponse' ? 'gapFill' : type,
    prompt: item.q ?? item.sentence ?? '',
    payload: { ...clean, unitId: item.unit ?? 0 } as any,
    xp: 0,
    estSeconds: 30,
    schema: 2,
    difficulty: opts.level ?? 'core',
    unitId: item.unit ?? 0,
  } as unknown as Activity;
  return { item, activity: type === 'shortResponse' ? null : activity };
}

/**
 * Part E — the Final Gate order. The pack ships speaking items last and the
 * non-speaking run alternates skills. This function asserts both properties
 * at load time so a future pack edit cannot silently break the composition.
 */
export function orderedFinalGateItems(): CapstoneItem[] {
  const items = pack.finalGate.items;
  const speakingIdx = items.findIndex(i => i.skill === 'speaking');
  if (speakingIdx >= 0) {
    const tail = items.slice(speakingIdx);
    if (tail.some(i => i.skill !== 'speaking')) {
      throw new Error('capstone: speaking items must come last in the Final Gate');
    }
  }
  for (let i = 1; i < speakingIdx; i++) {
    if (items[i].skill === items[i - 1].skill) {
      throw new Error(`capstone: Final Gate items ${i - 1}/${i} test the same skill`);
    }
  }
  return items;
}

/** Part C rule 3 / check 5 — no three consecutive UNIT-LABELLED items from
 * the same unit inside one station (no unit block detectable). Reading and
 * writing items carry no unit: their passages and checklists already span
 * the island's three units, so they cannot form a unit block. */
export function verifyInterleaving(): string[] {
  const problems: string[] = [];
  for (const { island, station } of allCapstoneStations()) {
    let run = 1;
    for (let i = 1; i < station.items.length; i++) {
      const a = station.items[i];
      const b = station.items[i - 1];
      if (a.unit === undefined || b.unit === undefined) { run = 1; continue; }
      run = a.unit === b.unit ? run + 1 : 1;
      if (run >= 3) problems.push(`${island.id}/${station.id}: items ${i - 1}–${i + 1} share unit ${a.unit}`);
    }
  }
  return problems;
}
