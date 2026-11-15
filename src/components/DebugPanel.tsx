import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { units } from '../data/units';
import { ACTIVITY_COUNTS, LEVEL_LABELS, SKILL_LABELS, type Level, type Skill } from '../types';

const SKILL_ORDER: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];
const EXPECTED_TOTAL = 20;
const EXPECTED_XP = 100;

interface LevelReport {
  level: Level;
  total: number;
  xp: number;
  ok: boolean;
  boss: number;
  perSkill: { skill: Skill; expected: number; actual: number; xpEach: number }[];
}

/**
 * Dev-only weighting audit, shown when the URL contains ?debug=1.
 * Verifies every playable level builds exactly EXPECTED_TOTAL activities
 * worth EXPECTED_XP XP, split per ACTIVITY_COUNTS.
 */
export function DebugPanel() {
  const location = useLocation();
  const enabled = new URLSearchParams(location.search).get('debug') === '1';

  const report = useMemo(() => {
    return units
      .filter(u => u.status === 'playable')
      .map(unit => ({
        unit,
        levels: (['easy', 'core', 'challenging'] as Level[]).map((level): LevelReport => {
          const acts = unit.levels[level];
          const perSkill = SKILL_ORDER.map(skill => ({
            skill,
            expected: ACTIVITY_COUNTS[skill],
            actual: acts.filter(a => a.skill === skill).length,
            xpEach: acts.find(a => a.skill === skill)?.xp ?? 0,
          }));
          const total = acts.length;
          const xp = acts.reduce((sum, a) => sum + a.xp, 0);
          const ok =
            total === EXPECTED_TOTAL &&
            xp === EXPECTED_XP &&
            perSkill.every(p => p.actual === p.expected);
          return { level, total, xp, ok, boss: unit.bossActivities?.[level]?.length ?? 0, perSkill };
        }),
      }));
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-card bg-ink text-white shadow-2xl p-4 text-xs"
      role="status"
      aria-label="Weighting debug panel"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-heading font-700 text-sm">Weighting check</p>
        <span className="text-white/50 tnum">?debug=1</span>
      </div>
      <div className="space-y-3">
        {report.map(({ unit, levels }) => (
          <div key={unit.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
            <p className="font-medium mb-1.5 text-white/80">
              Unit {unit.id}: {unit.title}
            </p>
            {levels.map(({ level, total, xp, ok, boss, perSkill }) => (
              <div key={level} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{LEVEL_LABELS[level]}</span>
                  <span className="tnum">
                    {total} activities · {xp} XP
                    <span className={`ml-1.5 font-bold ${ok ? 'text-mint' : 'text-coral'}`}>
                      {ok ? 'PASS' : 'FAIL'}
                    </span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {perSkill.map(({ skill, expected, actual, xpEach }) => (
                    <span
                      key={skill}
                      className={`px-1.5 py-0.5 rounded-pill tnum ${
                        actual === expected ? 'bg-mint/20 text-mint' : 'bg-coral/25 text-coral font-bold'
                      }`}
                      title={`${xpEach} XP each`}
                    >
                      {SKILL_LABELS[skill]} {actual}/{expected}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-white/40 tnum">boss station: {boss} activities (excluded)</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
