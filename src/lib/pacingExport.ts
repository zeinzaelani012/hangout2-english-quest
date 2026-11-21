// PHASE 11a — the pacing export: merge, calibrate, and get the timing
// telemetry off the device. Local LevelTiming records + imported CSV rows
// become one table; the calibration math is the point of the phase.
//
// THE RATIO RULE (Part D): ratio = measured / RAW projection, never measured
// / current label. Against the label every unit reads ≈1.0 and confirms a
// constant that may be wrong; against raw it is the k estimate that can
// overturn 0.72.

import type { Level, LevelTiming, ProgressData } from '../types';
import { units } from '../data/units';
import { LEVEL_MULTIPLIER } from './pacing';

export const IMPORTED_STORE_KEY = 'h2eq.timing.imported.v1';

export const STATION_ORDER = [
  'vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking', 'checkpoint', 'boss',
] as const;

export type TimingSource = 'local' | 'imported' | 'sample';

export interface TimingRow {
  runId: string;
  learner: string;
  unit: number;
  unitTitle: string;
  level: Level;
  startedAt: number;
  totalMinutes: number;
  activityCount: number;
  secPerActivity: number;
  fastCompletion: boolean;
  isTestRun: boolean;
  rawProjected: number;
  currentLabel: number;
  ratio: number;
  perStation: Record<string, number>;
  source: TimingSource;
  sourceFile?: string;
}

// ── Raw projection (Part D) ───────────────────────────────────────────────────

const rawMinutesCache = new Map<string, number>();

/** Pre-calibration projection, minutes: (content estSeconds × level
 * multiplier + checkpoint estSeconds) / 60 — the "+720" in the phase spec is
 * Unit 1's CP1+BOSS sum (720 s), so the checkpoint seconds come from the pack
 * rather than a magic number. Checkpoint slots live in `bossActivities`, not
 * `levels`, so both arrays are scanned. */
export function rawProjectedMinutes(unitId: number, level: Level): number | null {
  const key = `${unitId}-${level}`;
  const cached = rawMinutesCache.get(key);
  if (cached !== undefined) return cached;
  const unit = units.find(u => u.id === unitId);
  if (!unit) return null;
  const acts = [...(unit.levels[level] ?? []), ...(unit.bossActivities?.[level] ?? [])];
  let content = 0;
  let checkpoints = 0;
  let tagged = 0;
  for (const a of acts) {
    if (typeof a.estSeconds !== 'number') continue;
    tagged++;
    if (a.skill === 'mixed') checkpoints += a.estSeconds;
    else content += a.estSeconds;
  }
  if (acts.length === 0 || tagged / acts.length < 0.8) return null;
  const raw = (content * LEVEL_MULTIPLIER[level] + checkpoints) / 60;
  rawMinutesCache.set(key, raw);
  return raw;
}

function labelFor(unitId: number, level: Level): number | null {
  const raw = rawProjectedMinutes(unitId, level);
  return raw === null ? null : raw * 0.72;
}

// ── Row assembly ──────────────────────────────────────────────────────────────

function stationSeconds(t: LevelTiming): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of STATION_ORDER) out[key] = t.perStation?.[key]?.seconds ?? 0;
  return out;
}

function activityCountOf(t: LevelTiming): number {
  return Object.values(t.perStation ?? {}).reduce((n, s) => n + (s.activities ?? 0), 0);
}

function makeRow(
  unitId: number, level: Level, startedAt: number, t: LevelTiming, learner: string, source: TimingSource,
): TimingRow | null {
  const unit = units.find(u => u.id === unitId);
  const raw = rawProjectedMinutes(unitId, level);
  if (raw === null) return null;
  const label = labelFor(unitId, level) ?? 0;
  const measured = (t.endedAt - t.startedAt) / 60000;
  const acts = activityCountOf(t);
  return {
    runId: `${unitId}-${level}-${startedAt}`,
    learner,
    unit: unitId,
    unitTitle: unit?.title ?? `Unit ${unitId}`,
    level,
    startedAt,
    totalMinutes: Math.round(measured * 10) / 10,
    activityCount: acts,
    secPerActivity: acts > 0 ? Math.round(((measured * 60) / acts) * 10) / 10 : 0,
    fastCompletion: !!t.fastCompletion,
    isTestRun: false,
    rawProjected: Math.round(raw * 10) / 10,
    currentLabel: Math.round(label * 10) / 10,
    ratio: Math.round((measured / raw) * 1000) / 1000,
    perStation: stationSeconds(t),
    source,
  };
}

/** This device's own recordings, one row per level attempt. */
export function localTimingRows(progress: ProgressData, learner: string): TimingRow[] {
  const rows: TimingRow[] = [];
  const timings = progress.levelTimings ?? {};
  for (const [unitIdRaw, list] of Object.entries(timings)) {
    for (const t of list ?? []) {
      const row = makeRow(Number(unitIdRaw), t.level, t.startedAt, t, learner, 'local');
      if (row) rows.push(row);
    }
  }
  return rows;
}

// ── Imported store ────────────────────────────────────────────────────────────

export interface ImportedStore {
  rows: TimingRow[];
}

export function loadImportedStore(): ImportedStore {
  try {
    const raw = localStorage.getItem(IMPORTED_STORE_KEY);
    if (raw) return JSON.parse(raw) as ImportedStore;
  } catch { /* corrupt store — start clean */ }
  return { rows: [] };
}

function saveImportedStore(store: ImportedStore): void {
  try {
    localStorage.setItem(IMPORTED_STORE_KEY, JSON.stringify(store));
  } catch { /* storage full — keep in memory */ }
}

/** Merge rows into the imported store, deduplicating on runId. Never touches
 * local recordings — they live in eq.progress, a different store entirely. */
export function mergeImportedRows(incoming: TimingRow[]): { added: number; duplicates: number } {
  const store = loadImportedStore();
  const known = new Set(store.rows.map(r => r.runId));
  let added = 0;
  let duplicates = 0;
  for (const row of incoming) {
    if (known.has(row.runId)) {
      duplicates++;
      continue;
    }
    known.add(row.runId);
    store.rows.push(row);
    added++;
  }
  saveImportedStore(store);
  return { added, duplicates };
}

export function clearImportedRows(): void {
  saveImportedStore({ rows: [] });
}

/** The sample fixture — synthetic, marked, clearable; never real data. */
export function loadSampleData(): { added: number; duplicates: number } {
  const fixture = SAMPLE_ROWS;
  return mergeImportedRows(fixture.map(r => ({ ...r, source: 'sample' as const })));
}

// ── Merged view ───────────────────────────────────────────────────────────────

export function mergedRows(progress: ProgressData, learner: string): TimingRow[] {
  return [
    ...localTimingRows(progress, learner),
    ...loadImportedStore().rows,
  ].sort((a, b) =>
    a.unit - b.unit
    || a.level.localeCompare(b.level)
    || a.startedAt - b.startedAt,
  );
}

// ── Calibration summary (Part D) ──────────────────────────────────────────────

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface LevelSummary {
  level: Level;
  n: number;
  medianMinutes: number;
  rawProjected: number;
  ratio: number;
  stationFastest: string[];
  fastCount: number;
}

export interface CalibrationSummary {
  levels: LevelSummary[];
  fittedK: number;
  verdict: string;
  cleanCount: number;
  testCount: number;
}

const LEVELS: Level[] = ['easy', 'core', 'challenging'];

const STATION_LABELS: Record<string, string> = {
  vocabulary: 'Vocab', grammar: 'Grammar', listening: 'Listen', reading: 'Read',
  writing: 'Write', speaking: 'Speak', checkpoint: 'CP1', boss: 'Boss',
};

/** Summaries over CLEAN rows only (test runs excluded), medians everywhere. */
export function summarise(rows: TimingRow[]): CalibrationSummary {
  const clean = rows.filter(r => !r.isTestRun);
  const testCount = rows.length - clean.length;
  const levels: LevelSummary[] = [];
  for (const level of LEVELS) {
    const mine = clean.filter(r => r.level === level);
    if (mine.length === 0) continue;
    const medMinutes = Math.round(median(mine.map(r => r.totalMinutes)) * 10) / 10;
    const rawProjected = Math.round(median(mine.map(r => r.rawProjected)) * 10) / 10;
    const ratio = rawProjected > 0 ? Math.round((medMinutes / rawProjected) * 1000) / 1000 : 0;
    // The two stations with the lowest median seconds — the deepen candidates.
    const stationMedians = STATION_ORDER.map(key => ({
      key,
      med: median(mine.map(r => r.perStation[key] ?? 0)),
    })).sort((a, b) => a.med - b.med).slice(0, 2);
    levels.push({
      level,
      n: mine.length,
      medianMinutes: medMinutes,
      rawProjected,
      ratio,
      stationFastest: stationMedians.map(s => STATION_LABELS[s.key]),
      fastCount: mine.filter(r => r.fastCompletion).length,
    });
  }
  // Least squares THROUGH THE ORIGIN, fitted over the per-level summary
  // points (raw_i, median_i) — not a mean of the ratios, which would weight a
  // short lesson like a long one.
  let num = 0;
  let den = 0;
  for (const l of levels) {
    num += l.rawProjected * l.medianMinutes;
    den += l.rawProjected * l.rawProjected;
  }
  const fittedK = den > 0 ? Math.round((num / den) * 1000) / 1000 : 0;
  const verdict = Math.abs(fittedK - 0.72) <= 0.05
    ? 'Current constant holds. Keep 0.72.'
    : `Consider recalibrating to ${fittedK.toFixed(3)}.`;
  return { levels, fittedK, verdict, cleanCount: clean.length, testCount };
}

// ── CSV (Part E) ──────────────────────────────────────────────────────────────

const CSV_HEADER =
  'runId,learner,unit,unitTitle,level,startedAtISO,totalMinutes,activityCount,secPerActivity,fastCompletion,isTestRun,rawProjected,currentLabel,ratio,vocab_s,grammar_s,listening_s,reading_s,writing_s,speaking_s,checkpoint_s,boss_s';

/** Dot decimal separator ALWAYS, whatever the device locale. */
const num = (v: number, decimals = 1): string => v.toFixed(decimals);
const quote = (v: string): string => `"${String(v).replace(/"/g, '""')}"`;
const iso = (ts: number): string => new Date(ts).toISOString();

export function runIdOf(row: Pick<TimingRow, 'unit' | 'level' | 'startedAt'>): string {
  return `${row.unit}-${row.level}-${row.startedAt}`;
}

export function rowsToCsv(rows: TimingRow[], summary: CalibrationSummary): string {
  const lines: string[] = [CSV_HEADER];
  for (const r of rows) {
    lines.push([
      quote(r.runId),
      quote(r.learner),
      String(r.unit),
      quote(r.unitTitle),
      r.level,
      quote(iso(r.startedAt)),
      num(r.totalMinutes),
      String(r.activityCount),
      num(r.secPerActivity),
      r.fastCompletion ? 'true' : 'false',
      r.isTestRun ? 'true' : 'false',
      num(r.rawProjected),
      num(r.currentLabel),
      r.ratio.toFixed(3),
      ...STATION_ORDER.map(k => String(r.perStation[k] ?? 0)),
    ].join(','));
  }
  lines.push('');
  lines.push('# summary');
  lines.push('# level,n,medianMinutes,rawProjected,ratio');
  for (const s of summary.levels) {
    lines.push(`# ${s.level},${s.n},${num(s.medianMinutes)},${num(s.rawProjected)},${s.ratio.toFixed(3)}`);
  }
  lines.push(`# fitted k,${summary.fittedK.toFixed(3)}`);
  lines.push(`# verdict,${summary.verdict}`);
  return lines.join('\n');
}

/** Tab-separated for pasting straight into a spreadsheet. */
export function rowsToTsv(rows: TimingRow[], summary: CalibrationSummary): string {
  const tsvHeader = CSV_HEADER.split(',').join('\t');
  const lines: string[] = [tsvHeader];
  for (const r of rows) {
    lines.push([
      r.runId,
      r.learner,
      String(r.unit),
      r.unitTitle,
      r.level,
      iso(r.startedAt),
      num(r.totalMinutes),
      String(r.activityCount),
      num(r.secPerActivity),
      r.fastCompletion ? 'true' : 'false',
      r.isTestRun ? 'true' : 'false',
      num(r.rawProjected),
      num(r.currentLabel),
      r.ratio.toFixed(3),
      ...STATION_ORDER.map(k => String(r.perStation[k] ?? 0)),
    ].join('\t'));
  }
  lines.push('');
  lines.push('# summary');
  lines.push('# level\tn\tmedianMinutes\trawProjected\tratio');
  for (const s of summary.levels) {
    lines.push(`# ${s.level}\t${s.n}\t${num(s.medianMinutes)}\t${num(s.rawProjected)}\t${s.ratio.toFixed(3)}`);
  }
  lines.push(`# fitted k\t${summary.fittedK.toFixed(3)}`);
  lines.push(`# verdict\t${summary.verdict}`);
  return lines.join('\n');
}

// ── CSV import (Part F) ───────────────────────────────────────────────────────

/** A real CSV parser: quoted fields, escaped quotes, commas INSIDE quotes,
 * multi-line never (this format is one record per line). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);
  return rows;
}

export interface ImportResult {
  imported: TimingRow[];
  errors: Array<{ line: number; reason: string }>;
}

const isoToTs = (s: string): number => {
  const ts = Date.parse(s);
  return Number.isNaN(ts) ? NaN : ts;
};

/** Validate and convert parsed CSV data rows. Failed rows are reported with
 * their line number (counting from the first DATA row after the header) and
 * are NOT imported. */
export function csvToRows(text: string, sourceFile: string): ImportResult {
  const parsed = parseCsv(text);
  const imported: TimingRow[] = [];
  const errors: Array<{ line: number; reason: string }> = [];
  let dataLines = 0;
  for (let i = 0; i < parsed.length; i++) {
    const cells = parsed[i];
    const first = (cells[0] ?? '').trim();
    if (first.startsWith('#') || first === '') continue; // summary comments
    if (first === 'runId' && (cells[1] ?? '') === 'learner') continue; // header
    dataLines++;
    const lineNo = dataLines; // 1-based over data rows
    const get = (idx: number) => (cells[idx] ?? '').trim();
    if (!get(0)) { errors.push({ line: lineNo, reason: 'missing runId' }); continue; }
    const level = get(4) as Level;
    if (!['easy', 'core', 'challenging'].includes(level)) {
      errors.push({ line: lineNo, reason: `bad level "${get(4)}"` });
      continue;
    }
    const totalMinutes = Number(get(6));
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      errors.push({ line: lineNo, reason: `totalMinutes is not a number ("${get(6)}")` });
      continue;
    }
    const startedAt = isoToTs(get(5));
    if (!Number.isFinite(startedAt)) {
      errors.push({ line: lineNo, reason: `startedAtISO is not an ISO date ("${get(5)}")` });
      continue;
    }
    const unit = Number(get(2)) || 0;
    const raw = rawProjectedMinutes(unit, level);
    const row: TimingRow = {
      runId: get(0),
      learner: get(1),
      unit,
      unitTitle: get(3),
      level,
      startedAt,
      totalMinutes: Math.round(totalMinutes * 10) / 10,
      activityCount: Number(get(7)) || 0,
      secPerActivity: Number(get(8)) || 0,
      fastCompletion: get(9) === 'true',
      isTestRun: get(10) === 'true',
      rawProjected: Number(get(11)) || Math.round((raw ?? 0) * 10) / 10,
      currentLabel: Number(get(12)) || 0,
      ratio: Number(get(13)) || 0,
      perStation: {
        vocabulary: Number(get(14)) || 0,
        grammar: Number(get(15)) || 0,
        listening: Number(get(16)) || 0,
        reading: Number(get(17)) || 0,
        writing: Number(get(18)) || 0,
        speaking: Number(get(19)) || 0,
        checkpoint: Number(get(20)) || 0,
        boss: Number(get(21)) || 0,
      },
      source: 'imported',
      sourceFile,
    };
    imported.push(row);
  }
  return { imported, errors };
}

// ── Sample fixture (Part G) ───────────────────────────────────────────────────

/**
 * The synthetic Unit 1 pilot fixture — ten clean records whose medians land
 * exactly on the measured 45 / 49 / 53, plus one fast test run excluded from
 * the summary. SYNTHETIC; marked as sample; cleared with the imported data.
 */
const SAMPLE_RAW: Array<{ learner: string; level: Level; totalSeconds: number; activityCount: number; fast: boolean; test: boolean }> = [
  { learner: 'Aisyah Nur Fadhilah', level: 'easy', totalSeconds: 2580, activityCount: 32, fast: false, test: false },
  { learner: 'Fatimah Az-Zahra', level: 'easy', totalSeconds: 2640, activityCount: 32, fast: false, test: false },
  { learner: 'Zahra Aulia', level: 'easy', totalSeconds: 2760, activityCount: 32, fast: false, test: false },
  { learner: 'Nabila Putri', level: 'easy', totalSeconds: 2820, activityCount: 32, fast: false, test: false },
  { learner: 'Salma Kamila', level: 'core', totalSeconds: 2820, activityCount: 32, fast: false, test: false },
  { learner: 'Hana Salsabila', level: 'core', totalSeconds: 2880, activityCount: 32, fast: false, test: false },
  { learner: 'Rania Adiba', level: 'core', totalSeconds: 3000, activityCount: 32, fast: false, test: false },
  { learner: 'Dinda Ayu', level: 'core', totalSeconds: 3060, activityCount: 32, fast: false, test: false },
  { learner: 'Khansa Lubna', level: 'challenging', totalSeconds: 3120, activityCount: 32, fast: false, test: false },
  { learner: 'Shifa Amalia', level: 'challenging', totalSeconds: 3240, activityCount: 32, fast: false, test: false },
  { learner: 'DEMO — practice run', level: 'easy', totalSeconds: 840, activityCount: 32, fast: true, test: true },
];

// Per-station split reproducing the fixture (shares of the total).
const SAMPLE_SPLIT: Record<string, number[]> = {
  easy: [534, 322, 215, 322, 214, 536, 182, 255],
  core: [584, 352, 234, 352, 234, 586, 199, 279],
  challenging: [646, 389, 259, 389, 259, 649, 220, 309],
};
const TEST_SPLIT = [174, 105, 70, 105, 70, 174, 59, 83];

// Session start times: one morning per level (matches the fixture's days).
const SAMPLE_DAYS: Record<Level, number> = {
  easy: 1794819600000,
  core: 1794906000000,
  challenging: 1794992400000,
};

const SAMPLE_ROWS: TimingRow[] = (() => {
  const rows: TimingRow[] = [];
  let i = 0;
  for (const rec of SAMPLE_RAW) {
    const unit = 1;
    const startedAt = SAMPLE_DAYS[rec.level] + (rec.test ? 2760000 * 1 : i * 60000);
    const raw = rawProjectedMinutes(unit, rec.level) ?? 0;
    const split = rec.test ? TEST_SPLIT : SAMPLE_SPLIT[rec.level];
    rows.push({
      runId: `${unit}-${rec.level}-${startedAt}`,
      learner: rec.learner,
      unit,
      unitTitle: 'Snack Time',
      level: rec.level,
      startedAt,
      totalMinutes: Math.round((rec.totalSeconds / 60) * 10) / 10,
      activityCount: rec.activityCount,
      secPerActivity: Math.round((rec.totalSeconds / rec.activityCount) * 10) / 10,
      fastCompletion: rec.fast,
      isTestRun: rec.test,
      rawProjected: Math.round(raw * 10) / 10,
      currentLabel: Math.round(raw * 0.72 * 10) / 10,
      ratio: Math.round(((rec.totalSeconds / 60) / raw) * 1000) / 1000,
      perStation: Object.fromEntries(STATION_ORDER.map((k, idx) => [k, split[idx]])),
      source: 'sample',
      sourceFile: 'hangout2-sample-pilot-timings.json',
    });
    i++;
  }
  return rows;
})();
