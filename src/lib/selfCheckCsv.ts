import type { ProgressData, SelfAssessmentRecord, Skill } from '../types';
import { computeSkillAccuracy } from './skillAccuracy';

const SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

const csvCell = (value: string | number | undefined | null): string => {
  const s = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Flag for one skill row: high = rated 3 but scored under 50%; low = rated 1 but scored over 70%. */
export function selfCheckFlag(rating: number | undefined, pct: number): string {
  if (rating === 3 && pct < 50) return 'high';
  if (rating === 1 && pct > 70) return 'low';
  return '';
}

/**
 * CSV export for Teacher Mode's Self-check tab: one row per skill per
 * self-assessment record, with the learner's rating beside their actual
 * accuracy, the flag column, the hardest choice and the note as written.
 */
export function buildSelfCheckCsv(
  progress: ProgressData,
  learnerName: string,
  resolveSkill: (unitId: number, stationId: string) => Skill | undefined,
): string {
  const header = [
    'learner', 'unit', 'level', 'completed', 'skipped',
    'skill', 'self rating (1-3)', 'accuracy %', 'flag', 'hardest', 'note',
  ].join(',');
  const rows: string[] = [header];

  const records = Object.entries(progress.selfAssessments ?? {}).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, record] of records) {
    const unitId = record.unit;
    const level = record.level;
    const completedDate = new Date(record.completedAt).toISOString().slice(0, 10);
    if (record.skipped) {
      rows.push([learnerName, unitId, level, completedDate, 'yes', '(skipped)', '', '', '', '', ''].map(csvCell).join(','));
      continue;
    }
    SKILLS.forEach((skill, index) => {
      const rating = record.ratings[skill];
      const accuracy = computeSkillAccuracyForUnit(progress, unitId, level, skill, resolveSkill);
      rows.push([
        learnerName,
        unitId,
        level,
        completedDate,
        'no',
        skill,
        rating ?? '',
        accuracy,
        selfCheckFlag(rating, accuracy),
        record.hardest === skill ? 'yes' : '',
        index === 0 ? record.note ?? '' : '',
      ].map(csvCell).join(','));
    });
  }
  return rows.join('\n');
}

function computeSkillAccuracyForUnit(
  progress: ProgressData,
  unitId: number,
  level: SelfAssessmentRecord['level'],
  skill: Skill,
  resolveSkill: (unitId: number, stationId: string) => Skill | undefined,
): number {
  const levelProgress = progress.units[unitId]?.[level];
  if (!levelProgress) return 0;
  let correct = 0;
  let total = 0;
  for (const [stationId, record] of Object.entries(levelProgress.stations)) {
    if (resolveSkill(unitId, stationId) !== skill) continue;
    for (const correctFlag of Object.values(record.attempts)) {
      total += 1;
      if (correctFlag) correct += 1;
    }
  }
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export type { SelfAssessmentRecord };
