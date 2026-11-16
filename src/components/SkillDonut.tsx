import { SKILL_COLORS, SKILL_LABELS, SKILL_WEIGHTS, type Skill } from '../types';

interface SkillDonutProps {
  size?: number;
}

export function SkillDonut({ size = 200 }: SkillDonutProps) {
  const skills: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];
  const total = skills.reduce((sum, s) => sum + SKILL_WEIGHTS[s], 0);
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = skills.map(skill => {
    const fraction = SKILL_WEIGHTS[skill] / total;
    const dashLength = fraction * circumference;
    const segment = {
      skill,
      color: SKILL_COLORS[skill],
      dashLength,
      dashOffset: cumulativeOffset,
      percentage: SKILL_WEIGHTS[skill],
    };
    cumulativeOffset += dashLength;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E8EDF2" strokeWidth={strokeWidth} />
        {segments.map(seg => (
          <circle
            key={seg.skill}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={-seg.dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={size * 0.1}
          fontWeight="800"
          fill="#172033"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          100
        </text>
        <text
          x={cx}
          y={cy + size * 0.08}
          textAnchor="middle"
          fontSize={size * 0.06}
          fill="#657083"
          fontFamily="Inter, sans-serif"
        >
          XP total
        </text>
      </svg>
      <div className="grid w-full grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
        {segments.map(seg => (
          <div key={seg.skill} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="truncate text-sm font-semibold text-ink">{SKILL_LABELS[seg.skill]}</span>
            <span className="tnum text-xs font-semibold text-muted">{seg.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
