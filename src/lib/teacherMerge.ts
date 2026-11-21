// PHASE 12 — ONE import mechanism for all three record types (Part D).
// The type is recognised from the header row; each type keeps its own
// imported store and its own dedupe key. Local records are never overwritten.

import type { Level, Skill } from '../types';
import type { TimingRow } from './pacingExport';
import { csvToRows as csvToTimingRows, mergeImportedRows, parseCsv } from './pacingExport';

export const SELFCK_IMPORTED_KEY = 'h2eq.selfcheck.imported.v1';
export const CAPSTONE_IMPORTED_KEY = 'h2eq.capstone.imported.v1';

export const SELFCK_HEADER =
  'learner,unit,level,date,vocabulary_r,vocabulary_pct,grammar_r,grammar_pct,listening_r,listening_pct,reading_r,reading_pct,writing_r,writing_pct,speaking_r,speaking_pct,flag,hardest,note';
const CAPSTONE_HEADER =
  'learner,overall,vocabulary_pct,grammar_pct,listening_pct,reading_pct,writing_pct,speaking_pct,outcome,certificateId,finishedAtISO';

// ── Self-check records ────────────────────────────────────────────────────────

export type SelfckSource = 'local' | 'imported' | 'sample';

export interface SelfckRecord {
  learner: string;
  unit: number;
  level: Level;
  /** 1–3 per skill; empty when skipped. */
  ratings: Partial<Record<Skill, number>>;
  /** Actual accuracy per skill — imported rows carry it; local rows compute it. */
  accuracy: Partial<Record<Skill, number>>;
  hardest: Skill | null;
  note: string;
  completedAt: number;
  skipped: boolean;
  source: SelfckSource;
  sourceFile?: string;
}

export function loadImportedSelfck(): SelfckRecord[] {
  try {
    const raw = localStorage.getItem(SELFCK_IMPORTED_KEY);
    if (raw) return JSON.parse(raw) as SelfckRecord[];
  } catch { /* corrupt */ }
  return [];
}

function saveImportedSelfck(rows: SelfckRecord[]): void {
  try {
    localStorage.setItem(SELFCK_IMPORTED_KEY, JSON.stringify(rows));
  } catch { /* storage full */ }
}

export const selfckDedupeKey = (r: { learner: string; unit: number; level: Level }): string =>
  `${r.unit}-${r.level}-${r.learner.trim().toLowerCase()}`;

/** Self-check conflict rule (Part D): rated BEFORE the results screen, so a
 * later completion replaces an earlier one — last completedAt wins. */
export function mergeSelfckRows(incoming: SelfckRecord[]): { added: number; replaced: number } {
  const store = loadImportedSelfck();
  let added = 0;
  let replaced = 0;
  for (const row of incoming) {
    const key = selfckDedupeKey(row);
    const idx = store.findIndex(r => selfckDedupeKey(r) === key);
    if (idx >= 0) {
      if ((row.completedAt ?? 0) >= (store[idx].completedAt ?? 0)) {
        store[idx] = row; // later completion replaces the earlier one
        replaced++;
      }
    } else {
      store.push(row);
      added++;
    }
  }
  saveImportedSelfck(store);
  return { added, replaced };
}

// ── Capstone attempts ─────────────────────────────────────────────────────────

export interface ImportedAttempt {
  id: string;
  learner: string;
  startedAt: number;
  finishedAt: number;
  skillScores: Partial<Record<Skill, number>> | null;
  overall: number | null;
  outcome: 'issued' | 'pending' | 'not_issued' | null;
  certificateId?: string;
  issuedAt?: number;
  releasedBy?: string;
  retakeNote?: string;
  /** Best seal score per seal id — part of the row expansion. */
  seals: Record<string, { correct: number; total: number }>;
  source: 'imported' | 'sample';
  sourceFile?: string;
}

export function loadImportedAttempts(): ImportedAttempt[] {
  try {
    const raw = localStorage.getItem(CAPSTONE_IMPORTED_KEY);
    if (raw) return JSON.parse(raw) as ImportedAttempt[];
  } catch { /* corrupt */ }
  return [];
}

function saveImportedAttempts(rows: ImportedAttempt[]): void {
  try {
    localStorage.setItem(CAPSTONE_IMPORTED_KEY, JSON.stringify(rows));
  } catch { /* storage full */ }
}

/**
 * CAPSTONE CONFLICT RULE (Part D). A learner may retake on more than one
 * device, so two files can carry two attempts for the same learner:
 *   if either attempt has outcome 'issued' → keep the issued one, immutable
 *   else                                   → keep the later finishedAt
 * Never merged, never averaged — the loser is kept in the store's history so
 * the row can show a "2 attempts" note.
 */
export function mergeCapstoneAttempts(incoming: ImportedAttempt[]): { added: number; duplicates: number; conflicts: number } {
  const store = loadImportedAttempts();
  let added = 0;
  let duplicates = 0;
  let conflicts = 0;
  for (const attempt of incoming) {
    const sameLearner = store.filter(a => a.learner === attempt.learner);
    if (sameLearner.some(a => a.id === attempt.id)) {
      duplicates++; // same attempt id — a re-import changes nothing
      continue;
    }
    const existing = sameLearner.find(a => a.outcome === attempt.outcome || a.outcome !== null);
    if (existing === undefined) {
      store.push(attempt);
      added++;
      continue;
    }
    conflicts++;
    const issued = sameLearner.find(a => a.outcome === 'issued');
    if (attempt.outcome === 'issued' && !issued) {
      // The newcomer is issued and no issued attempt exists: keep it, and
      // move the previous attempt aside (kept, not merged).
      store.splice(store.indexOf(existing), 1);
      store.push(attempt);
    } else if (issued && attempt.outcome !== 'issued') {
      // An issued attempt already exists — immutable, always. Drop the
      // newcomer; a retake can never downgrade an issued certificate.
    } else {
      const winner = (attempt.finishedAt ?? 0) > (existing.finishedAt ?? 0) ? attempt : existing;
      const loser = winner === attempt ? existing : attempt;
      const idx = store.indexOf(loser);
      if (idx >= 0 && winner === attempt) {
        store.splice(idx, 1);
        store.push(winner);
      }
    }
  }
  saveImportedAttempts(store);
  return { added, duplicates, conflicts };
}

// ── Import recognition (Part D) ───────────────────────────────────────────────

export interface ImportReport {
  timingFiles: number;
  selfckFiles: number;
  capstoneFiles: number;
  timingRows: number;
  selfckRows: number;
  capstoneRows: number;
  errors: Array<{ file: string; line: number; reason: string }>;
}

type CsvKind = 'timing' | 'selfcheck' | 'capstone' | 'unknown';

function recogniseKind(header: string): CsvKind {
  const h = header.trim().toLowerCase();
  if (h.startsWith('runid,learner,unit,unittitle,level,startedatiso')) return 'timing';
  if (h === SELFCK_HEADER) return 'selfcheck';
  if (h.startsWith('learner,overall,') || h.startsWith('learner,unit,level,completed')) return 'capstone';
  return 'unknown';
}

const SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

/** Parse one self-check CSV (the Phase 12 header) into records. */
export function parseSelfckCsv(text: string, sourceFile: string): { rows: SelfckRecord[]; errors: Array<{ line: number; reason: string }> } {
  const parsed = parseCsv(text);
  const rows: SelfckRecord[] = [];
  const errors: Array<{ line: number; reason: string }> = [];
  let dataLines = 0;
  for (const cells of parsed) {
    const first = (cells[0] ?? '').trim();
    if (first.startsWith('#') || first === '') continue;
    if (first === 'learner' && (cells[1] ?? '') === 'unit') continue;
    dataLines++;
    const line = dataLines;
    const get = (i: number) => (cells[i] ?? '').trim();
    if (!get(0)) { errors.push({ line, reason: 'missing learner' }); continue; }
    const level = get(2) as Level;
    if (!['easy', 'core', 'challenging'].includes(level)) {
      errors.push({ line, reason: `bad level "${get(2)}"` });
      continue;
    }
    const completedAt = Date.parse(get(3));
    if (!Number.isFinite(completedAt)) {
      errors.push({ line, reason: `bad date "${get(3)}"` });
      continue;
    }
    const ratings: Partial<Record<Skill, number>> = {};
    const accuracy: Partial<Record<Skill, number>> = {};
    SKILLS.forEach((skill, i) => {
      const r = Number(get(4 + i * 2));
      const p = Number(get(5 + i * 2));
      if (r >= 1 && r <= 3) ratings[skill] = r;
      if (Number.isFinite(p) && p > 0) accuracy[skill] = p;
    });
    rows.push({
      learner: get(0),
      unit: Number(get(1)) || 0,
      level,
      ratings,
      accuracy,
      hardest: null,
      note: get(18),
      completedAt,
      skipped: Object.keys(ratings).length === 0,
      source: 'imported',
      sourceFile,
    });
  }
  return { rows, errors };
}

/** Parse one capstone CSV (Phase 9's export header) into attempts. */
export function parseCapstoneCsv(text: string, sourceFile: string): { rows: ImportedAttempt[]; errors: Array<{ line: number; reason: string }> } {
  const parsed = parseCsv(text);
  const rows: ImportedAttempt[] = [];
  const errors: Array<{ line: number; reason: string }> = [];
  let dataLines = 0;
  for (const cells of parsed) {
    const first = (cells[0] ?? '').trim();
    if (first.startsWith('#') || first === '') continue;
    if (first === 'learner' && (cells[1] ?? '').toLowerCase() === 'overall') continue;
    dataLines++;
    const line = dataLines;
    const get = (i: number) => (cells[i] ?? '').trim();
    if (!get(0)) { errors.push({ line, reason: 'missing learner' }); continue; }
    const finishedAt = Date.parse(get(10));
    const overall = Number(get(1));
    if (!Number.isFinite(overall) && get(1) !== '') {
      errors.push({ line, reason: `overall is not a number ("${get(1)}")` });
      continue;
    }
    const skillScores: Partial<Record<Skill, number>> = {};
    SKILLS.forEach((skill, i) => {
      const v = Number(get(2 + i));
      if (Number.isFinite(v)) skillScores[skill] = v;
    });
    const outcome = (get(8) || null) as ImportedAttempt['outcome'];
    rows.push({
      id: `${get(0)}-${finishedAt || dataLines}`,
      learner: get(0),
      startedAt: Number.isFinite(finishedAt) ? finishedAt : 0,
      finishedAt: Number.isFinite(finishedAt) ? finishedAt : 0,
      skillScores,
      overall: Number.isFinite(overall) ? overall : null,
      outcome,
      certificateId: get(9) || undefined,
      seals: {},
      source: 'imported',
      sourceFile,
    });
  }
  return { rows, errors };
}

/** THE one entry point: any number of files of any of the three types, one
 * action. Each file's type is recognised from its header row and lands in the
 * right store. */
export async function importFiles(files: FileList | null): Promise<ImportReport> {
  const report: ImportReport = {
    timingFiles: 0, selfckFiles: 0, capstoneFiles: 0,
    timingRows: 0, selfckRows: 0, capstoneRows: 0,
    errors: [],
  };
  if (!files) return report;
  for (const file of Array.from(files)) {
    const text = await file.text();
    const header = text.split('\n')[0] ?? '';
    const kind = recogniseKind(header);
    if (kind === 'timing') {
      report.timingFiles++;
      const r = csvToTimingRows(text, file.name);
      report.timingRows += mergeImportedRows(r.imported).added;
      report.errors.push(...r.errors.map(e => ({ file: file.name, line: e.line, reason: e.reason })));
    } else if (kind === 'selfcheck') {
      report.selfckFiles++;
      const r = parseSelfckCsv(text, file.name);
      const merged = mergeSelfckRows(r.rows);
      report.selfckRows += merged.added + merged.replaced;
      report.errors.push(...r.errors.map(e => ({ file: file.name, line: e.line, reason: e.reason })));
    } else if (kind === 'capstone') {
      report.capstoneFiles++;
      const r = parseCapstoneCsv(text, file.name);
      const merged = mergeCapstoneAttempts(r.rows);
      report.capstoneRows += merged.added;
      report.errors.push(...r.errors.map(e => ({ file: file.name, line: e.line, reason: e.reason })));
    } else {
      report.errors.push({ file: file.name, line: 1, reason: 'unrecognised header — is this a Hangout 2 export?' });
    }
  }
  return report;
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/** Clears ALL THREE imported stores (and sample rows). Local recordings —
 * eq.progress timings, progress.selfAssessments, h2eq.capstone.v1 — are
 * never touched. */
export function clearAllImported(): void {
  for (const key of ['h2eq.timing.imported.v1', SELFCK_IMPORTED_KEY, CAPSTONE_IMPORTED_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
  // Sample roster entries clear too; a teacher-entered roster does not.
  try {
    const rosterRaw = localStorage.getItem('h2eq.roster.v1');
    if (rosterRaw) {
      const roster = JSON.parse(rosterRaw) as Array<{ sample?: boolean }>;
      localStorage.setItem('h2eq.roster.v1', JSON.stringify(roster.filter(r => !r.sample)));
    }
  } catch { /* ignore */ }
}

export function importedStoreCounts(): { timings: number; selfcheck: number; capstone: number } {
  let timings = 0;
  try {
    timings = (JSON.parse(localStorage.getItem('h2eq.timing.imported.v1') ?? '{"rows":[]}') as { rows: unknown[] }).rows.length;
  } catch { timings = 0; }
  return { timings, selfcheck: loadImportedSelfck().length, capstone: loadImportedAttempts().length };
}
