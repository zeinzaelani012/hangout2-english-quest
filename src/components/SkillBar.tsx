import { SKILL_COLORS, SKILL_LABELS, SKILL_WEIGHTS, type Skill } from '../types';

interface SkillBarProps {
  skill: Skill;
  earned: number;
  available: number;
  showWeight?: boolean;
}

export function SkillBar({ skill, earned, available, showWeight = false }: SkillBarProps) {
  const color = SKILL_COLORS[skill];
  const label = SKILL_LABELS[skill];
  const weight = SKILL_WEIGHTS[skill];
  const percent = available > 0 ? Math.min(100, (earned / available) * 100) : 0;

  return (
    <div
      className="grid h-8 grid-cols-[7.5rem_1fr_3rem] items-center gap-3"
      title={`${label}: ${earned} of ${available} XP earned (${weight}% of level weight)`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-sm font-semibold text-ink">{label}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <div className="tnum text-right text-xs font-semibold text-muted">
        {showWeight ? (
          <span className="text-ink">{weight}%</span>
        ) : (
          <span>{earned}/{available}</span>
        )}
      </div>
    </div>
  );
}
