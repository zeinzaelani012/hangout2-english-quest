import type { Level, Skill, Unit } from '../types';
import type { ProgressData } from '../types';

export interface SkillAccuracy {
  correct: number;
  total: number;
  pct: number;
}

/**
 * Per-skill accuracy for one level attempt, aggregated from the stored
 * station records (attempts are correct/incorrect per activity, and each
 * station maps to a skill via the unit's registry).
 */
export function computeSkillAccuracy(unit: Unit, level: Level, progress: ProgressData): Record<Skill, SkillAccuracy> {
  const skills: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];
  const out = {} as Record<Skill, SkillAccuracy>;
  for (const skill of skills) out[skill] = { correct: 0, total: 0, pct: 0 };

  const stationSkill = new Map(unit.stations.map(s => [s.id, s.skill]));
  const levelProgress = progress.units[unit.id]?.[level];
  if (!levelProgress) return out;

  for (const [stationId, record] of Object.entries(levelProgress.stations)) {
    const skill = stationSkill.get(stationId);
    if (!skill) continue;
    for (const correct of Object.values(record.attempts)) {
      out[skill].total += 1;
      if (correct) out[skill].correct += 1;
    }
  }
  for (const skill of skills) {
    out[skill].pct = out[skill].total > 0 ? Math.round((out[skill].correct / out[skill].total) * 100) : 0;
  }
  return out;
}

/** Plain-language band for an accuracy percentage. */
export function accuracyBand(pct: number): string {
  if (pct < 50) return 'Below 50%';
  if (pct < 70) return 'About half';
  if (pct < 90) return 'Most of it';
  return 'Nearly all';
}
