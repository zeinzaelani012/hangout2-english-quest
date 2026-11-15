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
      className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 h-8"
      title={`${label}: ${earned} of ${available} XP earned (${weight}% of level weight)`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-ink truncate">{label}</span>
      </div>
      <div className="h-3 rounded-pill bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-right text-sm tnum text-muted">
        {showWeight ? (
          <span className="font-medium text-ink">{weight}%</span>
        ) : (
          <span>{earned}/{available}</span>
        )}
      </div>
    </div>
  );
}
