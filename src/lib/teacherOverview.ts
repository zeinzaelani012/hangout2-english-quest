// PHASE 12 — THE shared dataset (Part J rule 10): the front page and every
// tab call this ONE function for their counts, so the cards can never
// disagree with the screens they open.

import type { ProgressData, Skill, Level } from '../types';
import { units } from '../data/units';
import { loadRoster, matchIdentity, loadLinks, normaliseName, type RosterEntry } from './teacherStore';
import { loadImportedSelfck, loadImportedAttempts, type SelfckRecord, type ImportedAttempt } from './teacherMerge';

export const SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

// ── Bands (Part E2) ───────────────────────────────────────────────────────────

export type Band = 'Emerging' | 'Developing' | 'Secure' | 'Strong';

export function bandFor(pct: number): Band {
  if (pct >= 85) return 'Strong';
  if (pct >= 70) return 'Secure';
  if (pct >= 50) return 'Developing';
  return 'Emerging';
}

export const BAND_DOTS = (band: Band): string =>
  band === 'Strong' ? '●●●' : band === 'Secure' ? '●●●' : band === 'Developing' ? '●●○' : '●○○';

// ── The unified self-check record ─────────────────────────────────────────────

export interface MergedSelfck extends SelfckRecord {
  /** Flags per skill: 'high' = rated 3 under 50; 'low' = rated 1 over 70. */
  flags: Partial<Record<Skill, 'high' | 'low'>>;
  /** The learner's name as shown after roster matching. */
  displayName: string;
  matched: boolean;
}

function flagFor(rating: number | undefined, pct: number | undefined): 'high' | 'low' | undefined {
  if (rating === 3 && pct !== undefined && pct < 50) return 'high';
  if (rating === 1 && pct !== undefined && pct > 70) return 'low';
  return undefined;
}

/** The local device's own records — accuracy computed from its progress. */
function localSelfck(progress: ProgressData, learner: string): SelfckRecord[] {
  const out: SelfckRecord[] = [];
  const timingsUnits = progress.units ?? {};
  for (const [key, record] of Object.entries(progress.selfAssessments ?? {})) {
    const unitId = record.unit;
    const unit = units.find(u => u.id === unitId);
    const accuracy: Partial<Record<Skill, number>> = {};
    for (const skill of SKILLS) {
      accuracy[skill] = computeLocalAccuracy(progress, unitId, record.level, skill);
    }
    void timingsUnits; void unit;
    out.push({
      learner,
      unit: unitId,
      level: record.level,
      ratings: record.ratings ?? {},
      accuracy,
      hardest: record.hardest,
      note: record.note ?? '',
      completedAt: record.completedAt,
      skipped: record.skipped,
      source: 'local',
    });
  }
  return out;
}

function computeLocalAccuracy(progress: ProgressData, unitId: number, level: Level, skill: Skill): number {
  const unit = units.find(u => u.id === unitId);
  const lp = progress.units?.[unitId]?.[level];
  if (!unit || !lp) return 0;
  let correct = 0;
  let total = 0;
  for (const [stationId, record] of Object.entries(lp.stations)) {
    const station = unit.stations.find(s => s.id === stationId);
    if (station?.skill !== skill) continue;
    for (const ok of Object.values(record.attempts)) {
      total++;
      if (ok) correct++;
    }
  }
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// ── Capstone attempts (local + imported, never merged per learner) ────────────

export interface MergedAttempt {
  id: string;
  learner: string;
  displayName: string;
  matched: boolean;
  overall: number | null;
  outcome: 'issued' | 'pending' | 'not_issued' | null;
  skillScores: Partial<Record<Skill, number>> | null;
  certificateId?: string;
  issuedAt?: number;
  releasedBy?: string;
  retakeNote?: string;
  finishedAt: number;
  seals: Record<string, { correct: number; total: number }>;
  source: 'local' | 'imported' | 'sample';
  sourceFile?: string;
}

function localAttempts(progress: ProgressData): MergedAttempt[] {
  const store = readLocalCapstoneStore();
  const out: MergedAttempt[] = [];
  for (const [learner, slot] of Object.entries(store.learners ?? {})) {
    for (const attempt of [slot.current, ...slot.history]) {
      if (!attempt) continue;
      out.push({
        id: attempt.id,
        learner,
        displayName: learner,
        matched: true,
        overall: attempt.overall,
        outcome: attempt.outcome,
        skillScores: attempt.skillScores ?? null,
        certificateId: attempt.certificateId,
        issuedAt: attempt.issuedAt,
        releasedBy: attempt.releasedBy,
        retakeNote: attempt.retakeNote,
        finishedAt: attempt.finishedAt,
        seals: attempt.seals ?? {},
        source: 'local',
      });
    }
  }
  void progress;
  return out;
}

function readLocalCapstoneStore(): { learners: Record<string, { current: any | null; history: any[] }> } {
  try {
    const raw = localStorage.getItem('h2eq.capstone.v1');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { learners: {} };
}

// ── THE dataset ───────────────────────────────────────────────────────────────

export interface LearnerLine {
  learner: string;
  displayName: string;
  matched: boolean;
}

export interface TeacherDataset {
  roster: RosterEntry[];
  /** Merged self-check records with flags + resolved names, sorted. */
  selfck: MergedSelfck[];
  /** Merged capstone attempts, resolved names. */
  attempts: MergedAttempt[];
  /** The identity-status line data (Part C.4). */
  identity: { total: number; unmatched: number; unmatchedNames: string[] };
  /** Coverage per learner per unit — evidence = a self-check record for that
   * unit, or the local device's own completion flag. */
  coverage: { learner: string; displayName: string; matched: boolean; units: Set<number> }[];
  /** Front-page numbers (Part B). */
  overview: {
    coverageDone: number;
    coverageTotal: number;
    coverageOldestUnit: number | null;
    coverageOldestMissing: number;
    overconfident: number;
    underconfident: number;
    pendingCount: number;
    pendingOldestDays: number | null;
    /** The generated sentence about the most-flagged learner, or null. */
    misjudgeSentence: string | null;
    /** Learner name with the most high flags. */
    mostFlagged: { learner: string; high: number; low: number } | null;
  };
  /** Match helper for the tabs' filtered views. */
  resolve: (rawName: string) => { displayName: string; matched: boolean };
}

export function buildTeacherDataset(progress: ProgressData, localLearner: string): TeacherDataset {
  const roster = loadRoster();
  const links = loadLinks();
  const resolve = (rawName: string) => {
    const m = matchIdentity(rawName, roster, links);
    return { displayName: m.entry?.name ?? rawName, matched: m.entry !== null };
  };

  // Self-check: local + imported (+ sample rows ride in the imported store).
  const selfck: MergedSelfck[] = [];
  const rawSelfck = [...localSelfck(progress, localLearner), ...loadImportedSelfck()];
  for (const rec of rawSelfck) {
    const flags: Partial<Record<Skill, 'high' | 'low'>> = {};
    for (const skill of SKILLS) {
      const f = flagFor(rec.ratings[skill], rec.accuracy[skill]);
      if (f) flags[skill] = f;
    }
    const r = resolve(rec.learner);
    selfck.push({ ...rec, flags, displayName: r.displayName, matched: r.matched });
  }
  selfck.sort((a, b) => b.completedAt - a.completedAt);

  // Capstone: local + imported.
  const attempts: MergedAttempt[] = [
    ...localAttempts(progress),
    ...loadImportedAttempts().map(a => {
      const r = resolve(a.learner);
      return { ...a, displayName: r.displayName, matched: r.matched };
    }),
  ].sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  // Identity status (Part C.4).
  const allNames = new Set<string>([
    ...selfck.map(r => r.learner),
    ...attempts.map(r => r.learner),
  ]);
  let unmatched = 0;
  const unmatchedNames: string[] = [];
  for (const name of allNames) {
    const m = matchIdentity(name, roster, links);
    if (!m.entry) {
      unmatched++;
      if (unmatchedNames.length < 8) unmatchedNames.push(name);
    }
  }
  const identity = {
    total: (() => {
      // Distinct resolved learners across both record types.
      const names = new Set<string>([...selfck.map(r => r.displayName), ...attempts.map(r => r.displayName)]);
      return names.size;
    })(),
    unmatched,
    unmatchedNames,
  };

  // Coverage: evidence = a self-check record for that unit (any level), or the
  // local learner's own completed flag. Unknown learners still count under
  // their raw name (Part C.5) — flagged, never discarded.
  const coverage: TeacherDataset['coverage'] = [];
  const byLearner = new Map<string, { displayName: string; matched: boolean; units: Set<number> }>();
  for (const rec of selfck) {
    if (!rec.skipped) {
      const slot = byLearner.get(rec.learner) ?? { displayName: rec.displayName, matched: rec.matched, units: new Set<number>() };
      slot.units.add(rec.unit);
      byLearner.set(rec.learner, slot);
    }
  }
  // The local learner may have completed units without self-check records.
  for (const [unitIdRaw, levelsRecord] of Object.entries(progress.units ?? {})) {
    const core = (levelsRecord as any)?.core;
    const done = core?.completed === true || core?.stations?.boss?.completed === true;
    if (done) {
      const slot = byLearner.get(localLearner) ?? { displayName: localLearner, matched: true, units: new Set<number>() };
      slot.units.add(Number(unitIdRaw));
      byLearner.set(localLearner, slot);
    }
  }
  for (const [learner, slot] of byLearner) {
    coverage.push({ learner, displayName: slot.displayName, matched: slot.matched, units: slot.units });
  }

  // Flags + misjudgement.
  const flagsByLearner = new Map<string, { displayName: string; high: number; low: number }>();
  for (const rec of selfck) {
    for (const f of Object.values(rec.flags)) {
      if (!f) continue;
      const slot = flagsByLearner.get(rec.learner) ?? { displayName: rec.displayName, high: 0, low: 0 };
      slot[f]++;
      flagsByLearner.set(rec.learner, slot);
    }
  }
  const overconfident = [...flagsByLearner.values()].filter(s => s.high > 0).length;
  const underconfident = [...flagsByLearner.values()].filter(s => s.low > 0).length;
  const mostFlaggedEntry = [...flagsByLearner.entries()].sort((a, b) => b[1].high - a[1].high)[0] ?? null;
  let misjudgeSentence: string | null = null;
  if (mostFlaggedEntry && mostFlaggedEntry[1].high > 1) {
    const [learner, slot] = mostFlaggedEntry;
    const accs = selfck
      .filter(r => r.learner === learner)
      .flatMap(r => SKILLS.map(s => r.accuracy[s]).filter((v): v is number => v !== undefined));
    const lo = accs.length ? Math.min(...accs) : 0;
    const hi = accs.length ? Math.max(...accs) : 0;
    misjudgeSentence = `${slot.displayName} rates herself 'Yes' in every skill, and has scored between ${lo}% and ${hi}%. Worth a conversation.`;
  }
  const mostFlagged = mostFlaggedEntry
    ? { learner: mostFlaggedEntry[0], high: mostFlaggedEntry[1].high, low: mostFlaggedEntry[1].low }
    : null;

  // Pending queue.
  const pending = attempts.filter(a => a.outcome === 'pending');
  const pendingOldestDays = pending.length > 0
    ? Math.floor((Date.now() - Math.min(...pending.map(a => a.finishedAt ?? Date.now()))) / 86400000)
    : null;

  // Coverage overview: the newest unit with evidence, and the oldest gap.
  const coverageDone = coverage.filter(c => c.units.has(5)).length;
  const coverageTotal = Math.max(coverage.length, roster.length);
  let coverageOldestUnit: number | null = null;
  let coverageOldestMissing = 0;
  for (let u = 1; u <= 9; u++) {
    const missing = coverage.filter(c => !c.units.has(u)).length;
    if (missing > 0) {
      coverageOldestUnit = u;
      coverageOldestMissing = missing;
      break;
    }
  }

  return {
    roster,
    selfck,
    attempts,
    identity,
    coverage,
    overview: {
      coverageDone,
      coverageTotal,
      coverageOldestUnit,
      coverageOldestMissing,
      overconfident,
      underconfident,
      pendingCount: pending.length,
      pendingOldestDays,
      misjudgeSentence,
      mostFlagged,
    },
    resolve,
  };
}

// ── Sample class data (Part H) ────────────────────────────────────────────────

interface SampleFixture {
  roster: Array<{ name: string; class: string }>;
  selfAssessment: Record<string, Array<{ unit: number; level: Level; ratings: Record<string, number>; accuracy: Record<string, number>; hardest: string; note: string | null; completedAt: number; skipped: boolean }>>;
  capstoneAttempts: Array<{ id: string; learner: string; startedAt: string; finishedAt: string; skillScores: Record<string, number>; overall: number; outcome: string; certificateId: string | null; issuedAt?: string; releasedBy?: string | null; seals?: Record<string, { correct: number; total: number }> }>;
}

/** Loads the Phase 12 fixture into the imported stores + the roster, all
 * flagged sample. Never mixes silently: every row shows "sample" as source
 * and Clear imported data removes all of it. */
export async function loadSampleClassData(): Promise<void> {
  const res = await fetch('/sample/hangout2-sample-teacher-mode.json');
  if (!res.ok) throw new Error('sample fixture not found');
  const fixture = (await res.json()) as SampleFixture;

  // Roster (flagged sample so Clear removes it; teacher entries survive).
  const roster = loadRoster().filter(r => !r.sample);
  for (const entry of fixture.roster) {
    const id = normaliseName(entry.name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!roster.some(r => r.id === id)) {
      roster.push({ id, name: entry.name, class: entry.class, addedAt: Date.now(), sample: true });
    }
  }
  localStorage.setItem('h2eq.roster.v1', JSON.stringify(roster));

  // Self-check records.
  const selfck: SelfckRecord[] = [];
  for (const [learner, records] of Object.entries(fixture.selfAssessment)) {
    for (const rec of records) {
      selfck.push({
        learner,
        unit: rec.unit,
        level: rec.level,
        ratings: rec.ratings as Partial<Record<Skill, number>>,
        accuracy: rec.accuracy as Partial<Record<Skill, number>>,
        hardest: (rec.hardest as Skill) ?? null,
        note: rec.note ?? '',
        completedAt: rec.completedAt,
        skipped: rec.skipped,
        source: 'sample',
        sourceFile: 'hangout2-sample-teacher-mode.json',
      });
    }
  }
  localStorage.setItem('h2eq.selfcheck.imported.v1', JSON.stringify(selfck));

  // Capstone attempts.
  const attempts: ImportedAttempt[] = fixture.capstoneAttempts.map(a => ({
    id: a.id,
    learner: a.learner,
    startedAt: Date.parse(a.startedAt) || 0,
    finishedAt: Date.parse(a.finishedAt) || 0,
    skillScores: a.skillScores,
    overall: a.overall,
    outcome: a.outcome as ImportedAttempt['outcome'],
    certificateId: a.certificateId ?? undefined,
    issuedAt: a.issuedAt ? Date.parse(a.issuedAt) : undefined,
    releasedBy: a.releasedBy ?? undefined,
    seals: a.seals ?? {},
    source: 'sample',
    sourceFile: 'hangout2-sample-teacher-mode.json',
  }));
  localStorage.setItem('h2eq.capstone.imported.v1', JSON.stringify(attempts));
}
