import { projectedMinutes } from './pacing';
import { SKILL_LABELS, type Level, type Skill, type Unit } from '../types';

/** Per-skill share of the level's content seconds, with tolerance (points). */
export const SKILL_SHARE_TARGETS: Record<Skill, number> = {
  speaking: 25,
  vocabulary: 25,
  grammar: 15,
  reading: 15,
  listening: 10,
  writing: 10,
};
const SKILL_TOLERANCE = 2;
const SKILL_ORDER: Skill[] = ['speaking', 'vocabulary', 'grammar', 'reading', 'listening', 'writing'];
const DEPTH_MOVES = ['D1', 'D2', 'D3', 'D4', 'D5'] as const;
const CONTENT_COUNT = 30;
const CHECKPOINT_COUNT = 2;
const MINUTES_RANGE: [number, number] = [60, 78];
const XP_CONTENT = 100;
const XP_CP1 = 15;
const XP_BOSS = 25;

export interface PacingCheckRow {
  label: string;
  pass: boolean;
  detail: string;
  /** Activity ids implicated in a failure, when applicable. */
  offending?: string[];
}

/** True when a unit's activities carry the expanded-pack schema stamp. */
export function isInstrumentedUnit(unit: Unit): boolean {
  return (unit.levels.easy[0] as any)?.schema === 2;
}

/** Run every pacing rule for one unit level. */
export function auditLevelPacing(unit: Unit, level: Level): PacingCheckRow[] {
  const checkpoints = (unit.bossActivities?.[level] ?? []).filter(
    a => a.type === 'checkpoint' || a.type === 'boss',
  );
  const cp1 = checkpoints.find(a => a.type === 'checkpoint');
  const boss = checkpoints.find(a => a.type === 'boss');
  const content = unit.levels[level];
  const all = [...content, ...checkpoints];

  const rows: PacingCheckRow[] = [];

  // 1. Activity counts
  rows.push({
    label: 'content activity count',
    pass: content.length === CONTENT_COUNT,
    detail: `${content.length} (need ${CONTENT_COUNT})`,
    offending: content.length !== CONTENT_COUNT ? content.map(a => a.id) : undefined,
  });
  rows.push({
    label: 'checkpoint count',
    pass: checkpoints.length === CHECKPOINT_COUNT,
    detail: `${checkpoints.length} (need ${CHECKPOINT_COUNT})`,
    offending: checkpoints.length !== CHECKPOINT_COUNT ? checkpoints.map(a => a.id) : undefined,
  });

  // 2. Projected minutes
  const minutes = projectedMinutes(content, level);
  const minutesOk = minutes >= MINUTES_RANGE[0] && minutes <= MINUTES_RANGE[1];
  rows.push({
    label: 'projected minutes',
    pass: minutesOk,
    detail: `${minutes} (need ${MINUTES_RANGE[0]}–${MINUTES_RANGE[1]})`,
    offending: minutesOk ? undefined : content.map(a => a.id),
  });

  // 3. Per-skill share of estSeconds (content activities only)
  const contentSeconds = content.reduce((sum, a) => sum + (a.estSeconds ?? 60), 0);
  for (const skill of SKILL_ORDER) {
    const skillActs = content.filter(a => a.skill === skill);
    const seconds = skillActs.reduce((sum, a) => sum + (a.estSeconds ?? 60), 0);
    const share = contentSeconds > 0 ? (seconds / contentSeconds) * 100 : 0;
    const target = SKILL_SHARE_TARGETS[skill];
    const ok = Math.abs(share - target) <= SKILL_TOLERANCE;
    rows.push({
      label: `${SKILL_LABELS[skill]} share`,
      pass: ok,
      detail: `${share.toFixed(1)}% (${target}±${SKILL_TOLERANCE})`,
      offending: ok ? undefined : skillActs.map(a => a.id),
    });
  }

  // 4. XP: content 100 + CP1 15 + BOSS 25 = 140
  const contentXp = content.reduce((sum, a) => sum + a.xp, 0);
  const cp1Xp = cp1?.xp ?? 0;
  const bossXp = boss?.xp ?? 0;
  const xpTotal = contentXp + cp1Xp + bossXp;
  const xpOk = contentXp === XP_CONTENT && cp1Xp === XP_CP1 && bossXp === XP_BOSS;
  rows.push({
    label: 'total XP',
    pass: xpOk,
    detail: `content ${contentXp} + CP1 ${cp1Xp} + BOSS ${bossXp} = ${xpTotal} (need ${XP_CONTENT}+${XP_CP1}+${XP_BOSS}=140)`,
    offending: xpOk
      ? undefined
      : [...content, cp1, boss].filter((a): a is NonNullable<typeof a> =>
          !!a && ((a.type !== 'checkpoint' && a.type !== 'boss' && contentXp !== XP_CONTENT) || (a.type === 'checkpoint' && cp1Xp !== XP_CP1) || (a.type === 'boss' && bossXp !== XP_BOSS)),
        ).map(a => a.id),
  });

  // 5. Depth moves D1–D5 used at least twice across the level
  const moveCounts = new Map<string, number>();
  for (const move of DEPTH_MOVES) moveCounts.set(move, 0);
  for (const a of all) for (const move of a.depthMoves ?? []) moveCounts.set(move, (moveCounts.get(move) ?? 0) + 1);
  const missingMoves = DEPTH_MOVES.filter(m => (moveCounts.get(m) ?? 0) < 2);
  rows.push({
    label: 'depth moves (each ≥ 2)',
    pass: missingMoves.length === 0,
    detail: DEPTH_MOVES.map(m => `${m}×${moveCounts.get(m)}`).join(', '),
    offending: missingMoves.length > 0
      ? all.filter(a => (a.depthMoves ?? []).some(m => missingMoves.includes(m))).map(a => a.id)
      : undefined,
  });

  // 6. Every activity declares depthMoves
  const noMoves = all.filter(a => !a.depthMoves || a.depthMoves.length === 0);
  rows.push({
    label: 'activities without depthMoves',
    pass: noMoves.length === 0,
    detail: noMoves.length === 0 ? 'none' : `${noMoves.length} missing`,
    offending: noMoves.map(a => a.id),
  });

  return rows;
}

/** Plain-text report for the copy button. */
export function formatPacingReport(unit: Unit, levels: Level[]): string {
  const lines: string[] = [`PACING AUDIT — Unit ${unit.id}: ${unit.title}`];
  for (const level of levels) {
    lines.push('');
    lines.push(`${level.toUpperCase()}`);
    for (const row of auditLevelPacing(unit, level)) {
      lines.push(`  ${row.pass ? 'PASS' : 'FAIL'}  ${row.label}: ${row.detail}${row.offending?.length ? ` [${row.offending.join(', ')}]` : ''}`);
    }
  }
  return lines.join('\n');
}
