import { SKILL_COLORS, SKILL_LABELS, type Skill } from '../types';

interface RadarSeries {
  label: string;
  values: Record<Skill, number>; // 0-100
  color: string;
}

interface SkillRadarProps {
  series: RadarSeries[];
  size?: number;
}

export function SkillRadar({ series, size = 320 }: SkillRadarProps) {
  const skills: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;
  const numAxes = skills.length;

  // Axis positions
  const axisPoints = skills.map((_, i) => {
    const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxRadius,
      y: cy + Math.sin(angle) * maxRadius,
      angle,
    };
  });

  // Grid circles (4 levels)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Series polygons
  const seriesPolygons = series.map(s => {
    const points = skills.map((skill, i) => {
      const value = s.values[skill] || 0;
      const ratio = Math.min(1, value / 100);
      const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
      return {
        x: cx + Math.cos(angle) * maxRadius * ratio,
        y: cy + Math.sin(angle) * maxRadius * ratio,
      };
    });
    return { ...s, points };
  });

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
      <svg width={size} height={size} className="shrink-0">
        {/* Grid polygons */}
        {gridLevels.map(level => {
          const points = skills.map((_, i) => {
            const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
            return `${cx + Math.cos(angle) * maxRadius * level},${cy + Math.sin(angle) * maxRadius * level}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {axisPoints.map((pt, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}

        {/* Series polygons */}
        {seriesPolygons.map((s, si) => {
          const pointsStr = s.points.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <g key={si}>
              <polygon
                points={pointsStr}
                fill={s.color}
                fillOpacity={0.15}
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {s.points.map((pt, pi) => (
                <circle key={pi} cx={pt.x} cy={pt.y} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}

        {/* Axis labels */}
        {skills.map((skill, i) => {
          const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
          const labelRadius = maxRadius + 20;
          const x = cx + Math.cos(angle) * labelRadius;
          const y = cy + Math.sin(angle) * labelRadius;
          return (
            <text
              key={skill}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill={SKILL_COLORS[skill]}
              fontFamily="Inter, sans-serif"
            >
              {SKILL_LABELS[skill]}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm font-medium text-ink">{s.label}</span>
          </div>
        ))}
        {series.length === 0 && (
          <p className="text-sm text-muted">Complete a level to see your skill profile.</p>
        )}
      </div>
    </div>
  );
}
