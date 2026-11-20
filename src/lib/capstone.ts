// Phase 9 — capstone attempts, scoring and the certificate decision.
// Storage: `h2eq.capstone.v1` — one current attempt plus a history (max 5)
// per learner, so Teacher Mode can see every learner that used this device.

import type { CapstoneAttempt, CapstoneOutcome, CapstoneStore, ProgressData, Skill } from '../types';
import { capstoneFinalGate, capstoneIslands } from '../data/capstone';

const STORE_KEY = 'h2eq.capstone.v1';
const HISTORY_MAX = 5;

// The course's own weights — the same ones the units taught with. Do not
// switch to a flat mean here; that would quietly change what the course
// values at the last stage.
export const CAPSTONE_WEIGHTS: Record<Skill, number> = {
  speaking: 25,
  vocabulary: 25,
  grammar: 15,
  reading: 15,
  listening: 10,
  writing: 10,
};

export const SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

// ── Store ─────────────────────────────────────────────────────────────────────

export function loadCapstoneStore(): CapstoneStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as CapstoneStore;
  } catch {
    /* corrupt store — start clean */
  }
  return { learners: {} };
}

export function saveCapstoneStore(store: CapstoneStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage full — keep in memory */
  }
}

function emptyAttempt(learner: string): CapstoneAttempt {
  return {
    id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    learner,
    startedAt: Date.now(),
    finishedAt: 0,
    stations: {},
    seals: {},
    finalGate: { items: [] },
    skillScores: null,
    overall: null,
    outcome: null,
  };
}

/** The learner's current attempt, created on first capstone visit. */
export function getCurrentAttempt(learner: string): CapstoneAttempt {
  const store = loadCapstoneStore();
  const slot = store.learners[learner];
  if (slot?.current) return slot.current;
  const attempt = emptyAttempt(learner);
  slot ? (slot.current = attempt) : (store.learners[learner] = { current: attempt, history: [] });
  saveCapstoneStore(store);
  return attempt;
}

function updateAttempt(learner: string, mutate: (a: CapstoneAttempt) => void): CapstoneAttempt {
  const store = loadCapstoneStore();
  const slot = store.learners[learner] ?? { current: null, history: [] };
  const attempt = slot.current ?? emptyAttempt(learner);
  mutate(attempt);
  slot.current = attempt;
  store.learners[learner] = slot;
  saveCapstoneStore(store);
  return attempt;
}

/**
 * Archive the current attempt into history and open a fresh one. NEVER
 * overwrites the record that earned a certificate: issued attempts move to
 * history intact (Part I — a retake may never downgrade an issued one).
 */
export function startRetake(learner: string): CapstoneAttempt {
  const store = loadCapstoneStore();
  const slot = store.learners[learner] ?? { current: null, history: [] };
  if (slot.current) {
    slot.history.unshift(slot.current);
    slot.history = slot.history.slice(0, HISTORY_MAX);
  }
  slot.current = emptyAttempt(learner);
  store.learners[learner] = slot;
  saveCapstoneStore(store);
  return slot.current;
}

/**
 * Archive the current attempt WITHOUT opening a new one (used after the
 * certificate screen, so the issued attempt stays visible on return).
 */
export function archiveCurrentAttempt(learner: string): void {
  const store = loadCapstoneStore();
  const slot = store.learners[learner];
  if (slot?.current && slot.current.outcome === 'issued') {
    slot.history.unshift(slot.current);
    slot.history = slot.history.slice(0, HISTORY_MAX);
    slot.current = null;
    store.learners[learner] = slot;
    saveCapstoneStore(store);
  }
}

export function allLearnerAttempts(): Array<{ learner: string; attempt: CapstoneAttempt }> {
  const store = loadCapstoneStore();
  const out: Array<{ learner: string; attempt: CapstoneAttempt }> = [];
  for (const [learner, slot] of Object.entries(store.learners)) {
    if (slot.current) out.push({ learner, attempt: slot.current });
    for (const attempt of slot.history) out.push({ learner, attempt });
  }
  return out;
}

// ── Attempt mutations ─────────────────────────────────────────────────────────

export function recordStationResult(learner: string, stationId: string, correct: number, total: number, answered: number[]): CapstoneAttempt {
  return updateAttempt(learner, a => {
    a.stations[stationId] = { correct, total, answered };
  });
}

export function recordSealResult(learner: string, sealId: string, correct: number, total: number): CapstoneAttempt {
  return updateAttempt(learner, a => {
    // Keep the BEST seal score — passing again after a pass never lowers it,
    // and a retake below pass-mark does not erase an earlier pass.
    const prev = a.seals[sealId];
    const best = prev ? Math.max(prev.correct, correct) : correct;
    a.seals[sealId] = { correct: best, total };
  });
}

/** Record one Final Gate answer (resume support: answered items are kept). */
export function recordGateAnswer(learner: string, itemId: string, skill: Skill, correct: boolean): CapstoneAttempt {
  return updateAttempt(learner, a => {
    const existing = a.finalGate.items.find(i => i.id === itemId);
    if (existing) {
      existing.correct = correct;
      existing.answered = true;
    } else {
      a.finalGate.items.push({ id: itemId, skill, correct, answered: true });
    }
  });
}

export function setRetakeNoteSeen(learner: string): void {
  updateAttempt(learner, a => {
    delete a.retakeNote;
  });
}

// ── Scoring (Part F) ──────────────────────────────────────────────────────────

/**
 * SKILL SCORE — pooled across the Final Gate only. Station and seal results
 * never enter the overall. Speaking completes through the course's honest
 * self-check flow, so a completed speaking item counts as demonstrated.
 */
export function computeSkillScores(gateItems: Array<{ skill: Skill; correct: boolean; answered: boolean }>): Record<Skill, number> {
  const scores = {} as Record<Skill, number>;
  for (const skill of SKILLS) {
    const mine = gateItems.filter(i => i.skill === skill);
    if (mine.length === 0) {
      scores[skill] = 0;
      continue;
    }
    const answered = mine.filter(i => i.answered);
    const correct = answered.filter(i => i.correct).length;
    scores[skill] = Math.round((correct / mine.length) * 100);
  }
  return scores;
}

export function computeOverall(skillScores: Record<Skill, number>): number {
  const total = SKILLS.reduce((sum, s) => sum + (skillScores[s] ?? 0) * CAPSTONE_WEIGHTS[s], 0);
  const weight = SKILLS.reduce((sum, s) => sum + CAPSTONE_WEIGHTS[s], 0);
  return Math.round(total / weight);
}

/**
 * THE CERTIFICATE DECISION (Part G). Thresholds pasted:
 *   issued      overall >= 70  AND  every skill >= 50
 *   pending     overall < 70 (but >= 50)  OR  any single skill below 50
 *   not_issued  overall < 50
 * The skill floor matters as much as the average: 72% overall with 30%
 * speaking has not completed a course weighted 25% on speaking.
 */
export function decideOutcome(skillScores: Record<Skill, number>, overall: number): CapstoneOutcome {
  if (overall < 50) return 'not_issued';
  const allSkillsPassed = SKILLS.every(s => (skillScores[s] ?? 0) >= 50);
  if (overall >= 70 && allSkillsPassed) return 'issued';
  return 'pending';
}

export function finalizeAttempt(learner: string): CapstoneAttempt {
  return updateAttempt(learner, a => {
    const scores = computeSkillScores(a.finalGate.items);
    const overall = computeOverall(scores);
    a.skillScores = scores;
    a.overall = overall;
    a.outcome = decideOutcome(scores, overall);
    a.finishedAt = Date.now();
    // ISSUED certificates generate immediately (Part G) — stamp the issue
    // time; the deterministic certificate id is filled in by the results
    // screen's effect (crypto.subtle is async).
    if (a.outcome === 'issued' && !a.issuedAt) a.issuedAt = a.finishedAt;
  });
}

/** Stamp the deterministic certificate id (== verification code). */
export function setCertificateId(learner: string, id: string): void {
  updateAttempt(learner, a => {
    if (!a.certificateId) a.certificateId = id;
  });
}

// Bands for the certificate — never percentages (Part H).
export function bandFor(score: number): 'Emerging' | 'Developing' | 'Secure' | 'Strong' {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Secure';
  if (score >= 50) return 'Developing';
  return 'Emerging';
}

// ── Verification code (Part H) ────────────────────────────────────────────────

function toDateOnly(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * First 8 chars of sha256(learnerName + issueDate + overall), uppercased,
 * grouped in fours. Deterministic: re-issuing the same learner on the same
 * day at the same overall produces the same code, so a teacher can confirm
 * a printout without a database.
 */
export async function verificationCode(learnerName: string, issuedAt: number, overall: number): Promise<string> {
  const hex = await sha256Hex(`${learnerName}+${toDateOnly(issuedAt)}+${overall}`);
  const eight = hex.slice(0, 8).toUpperCase();
  return `${eight.slice(0, 4)}-${eight.slice(4)}`;
}

// ── Gating (Part B) ───────────────────────────────────────────────────────────

/** The capstone is locked until all nine unit CORE bosses are completed. */
export function coreBossesCompleted(progress: ProgressData): { done: boolean; missing: number[] } {
  const missing: number[] = [];
  for (let u = 1; u <= 9; u++) {
    const core = progress.units?.[u]?.core;
    const done = core?.bossCompleted === true || core?.stations?.boss?.completed === true;
    if (!done) missing.push(u);
  }
  return { done: missing.length === 0, missing };
}

/** The first (lowest) unit of an island that is not finished — the lock reason. */
export function islandLockUnit(islandUnits: number[], progress: ProgressData): number | null {
  for (const u of islandUnits) {
    const core = progress.units?.[u]?.core;
    const done = core?.bossCompleted === true || core?.stations?.boss?.completed === true;
    if (!done) return u;
  }
  return null;
}

export function islandStationsComplete(islandId: string, attempt: CapstoneAttempt): boolean {
  const island = capstoneIslands.find(i => i.id === islandId);
  if (!island) return false;
  return island.stations.every(s => attempt.stations[s.id] !== undefined);
}

export function islandSealPassed(islandId: string, attempt: CapstoneAttempt): boolean {
  const island = capstoneIslands.find(i => i.id === islandId);
  const seal = island?.seal;
  if (!seal) return false;
  const rec = attempt.seals[seal.id];
  return rec !== undefined && rec.correct >= seal.passMark;
}

export function allSealsPassed(attempt: CapstoneAttempt): boolean {
  return capstoneIslands.every(i => islandSealPassed(i.id, attempt));
}

export function allStationsComplete(attempt: CapstoneAttempt): boolean {
  return capstoneIslands.every(i => islandStationsComplete(i.id, attempt));
}

/** Where a returning learner resumes: the first station not yet recorded. */
export function firstIncompleteStation(attempt: CapstoneAttempt): { islandId: string; stationId: string } | null {
  for (const island of capstoneIslands) {
    for (const station of island.stations) {
      if (attempt.stations[station.id] === undefined) return { islandId: island.id, stationId: station.id };
    }
  }
  return null;
}

/** The Final Gate resumes at the first unanswered item — answered stay. */
export function firstUnansweredGateIndex(attempt: CapstoneAttempt): number {
  const items = capstoneFinalGate.items;
  for (let i = 0; i < items.length; i++) {
    const rec = attempt.finalGate.items.find(g => g.id === items[i].id);
    if (!rec || !rec.answered) return i;
  }
  return items.length;
}

// ── XP (Part F) ───────────────────────────────────────────────────────────────

/** 10 per station, 20 per seal pass, 50 for the Final Gate — computed from
 * what THIS mutation added. The caller passes what was just completed. */
export const CAPSTONE_XP = { station: 10, seal: 20, gate: 50 };

// ── Teacher actions (Part J) ──────────────────────────────────────────────────

/**
 * The ONLY path from pending to issued. Records who released it, stamps the
 * deterministic certificate id (== verification code), and never touches an
 * already-issued attempt.
 */
export async function releaseAttempt(learner: string, teacherName: string): Promise<CapstoneAttempt | null> {
  const store = loadCapstoneStore();
  const attempt = store.learners[learner]?.current;
  if (!attempt || attempt.outcome !== 'pending' || attempt.overall === null) return null;
  const issuedAt = Date.now();
  const id = await verificationCode(learner, issuedAt, attempt.overall);
  return updateAttempt(learner, a => {
    a.outcome = 'issued';
    a.issuedAt = issuedAt;
    a.releasedBy = teacherName || 'teacher';
    a.certificateId = id;
  });
}

export function returnAttempt(learner: string, note: string): CapstoneAttempt | null {
  const store = loadCapstoneStore();
  const attempt = store.learners[learner]?.current;
  if (!attempt || attempt.outcome !== 'pending') return null;
  return updateAttempt(learner, a => {
    a.outcome = 'not_issued';
    a.retakeNote = note.trim();
  });
}

// ── Teacher export (Part J) ───────────────────────────────────────────────────

export function capstoneCsv(rows: Array<{ learner: string; attempt: CapstoneAttempt }>): string {
  const header = 'learner,date,overall,vocabulary,grammar,listening,reading,writing,speaking,outcome,certificate id';
  const lines = rows.map(({ learner, attempt }) => {
    const s = attempt.skillScores ?? ({} as Record<Skill, number>);
    const date = attempt.finishedAt ? new Date(attempt.finishedAt).toISOString().slice(0, 10) : '';
    return [
      learner,
      date,
      attempt.overall ?? '',
      s.vocabulary ?? '', s.grammar ?? '', s.listening ?? '', s.reading ?? '', s.writing ?? '', s.speaking ?? '',
      attempt.outcome ?? '',
      attempt.certificateId ?? '',
    ].join(',');
  });
  return [header, ...lines].join('\n');
}
