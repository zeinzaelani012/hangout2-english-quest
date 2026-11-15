import { SKILL_COLORS, SKILL_LABELS, type Skill } from '../types';

interface SkillBarProps {
  skill: Skill;
  earned: number;
  available: number;
  showWeight?: boolean;
}

export function SkillBar({ skill, earned, available, showWeight = false }: SkillBarProps) {
  const color = SKILL_COLORS[skill];
  const label = SKILL_LABELS[skill];
  const percent = available > 0 ? Math.min(100, (earned / available) * 100) : 0;
  const weight = skill === 'speaking' ? 25 : skill === 'vocabulary' ? 25 : skill === 'listening' ? 10 : skill === 'reading' ? 15 : skill === 'writing' ? 10 : 15;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-pill bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-20 text-right text-sm tnum text-muted shrink-0">
        {showWeight && <span className="font-medium text-ink">{weight}%</span>}
        {!showWeight && <span>{earned}/{available}</span>}
      </div>
    </div>
  );
}
