import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, CheckCircle2, Play, Circle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit } from '../data/units';
import { StationBadge } from '../components/Illustrations';
import { SKILL_COLORS, SKILL_LABELS, LEVEL_LABELS, type Level } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function QuestMap() {
  const { unitId, level } = useParams();
  const navigate = useNavigate();
  const { isStationCompleted, getLevelProgressPercent } = useProgress();
  const reduceMotion = useReducedMotion();

  const unit = getUnit(parseInt(unitId || '0'));
  const levelKey = (level || 'easy') as Level;

  if (!unit || unit.status === 'placeholder') {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-800 text-2xl text-ink">Unit not available</h1>
        <Link to="/" className="text-brand hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const stations = unit.stations;
  const pct = getLevelProgressPercent(unit.id, levelKey);

  // Determine station states
  const stationStates = stations.map((station, i) => {
    const completed = isStationCompleted(unit.id, levelKey, station.id);
    const prevCompleted = i === 0 || isStationCompleted(unit.id, levelKey, stations[i - 1].id);
    const isCurrent = !completed && prevCompleted && i === stations.findIndex(s => !isStationCompleted(unit.id, levelKey, s.id));
    const isLocked = !completed && !prevCompleted && !isCurrent;

    return { station, completed, isCurrent, isLocked, index: i };
  });

  // SVG path — winding path through 7 nodes
  // Nodes positioned in a winding pattern
  const nodePositions = [
    { x: 100, y: 100 },
    { x: 300, y: 160 },
    { x: 150, y: 260 },
    { x: 350, y: 340 },
    { x: 120, y: 420 },
    { x: 320, y: 490 },
    { x: 200, y: 570 },
  ];

  const pathD = nodePositions.map((pos, i) => {
    if (i === 0) return `M ${pos.x} ${pos.y}`;
    const prev = nodePositions[i - 1];
    const midX = (prev.x + pos.x) / 2;
    const midY = (prev.y + pos.y) / 2;
    const offsetY = i % 2 === 0 ? -30 : 30;
    return `Q ${midX} ${midY + offsetY} ${pos.x} ${pos.y}`;
  }).join(' ');

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted mb-4" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand">Dashboard</Link>
        <ChevronRight size={14} />
        <Link to={`/unit/${unit.id}`} className="hover:text-brand">Unit {unit.id}</Link>
        <ChevronRight size={14} />
        <span className="text-ink font-medium">{LEVEL_LABELS[levelKey]}</span>
      </nav>

      <h1 className="font-heading font-800 text-2xl text-ink mb-2">
        {unit.islandName} — {LEVEL_LABELS[levelKey]}
      </h1>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-2 rounded-pill bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-pill bg-brand transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium tnum text-muted">{pct}%</span>
      </div>

      {/* Quest map SVG */}
      <div className="relative bg-white rounded-card shadow-card p-4 sm:p-8 mb-6 overflow-hidden">
        <svg
          viewBox="0 0 420 620"
          className="w-full h-auto"
          style={{ maxHeight: '80vh' }}
          role="img"
          aria-label="Quest map showing 7 stations"
        >
          {/* Background blobs */}
          <ellipse cx="100" cy="300" rx="80" ry="200" fill="#FFC145" opacity="0.06" />
          <ellipse cx="350" cy="350" rx="60" ry="180" fill="#2FB59A" opacity="0.05" />

          {/* Dashed path */}
          <path
            d={pathD}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="4"
            strokeDasharray="8 8"
            strokeLinecap="round"
          />

          {/* Animated path draw (skip under reduced motion) */}
          {!reduceMotion && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="#2B3A8F"
              strokeWidth="4"
              strokeDasharray="8 8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          )}

          {/* Nodes */}
          {stationStates.map(({ station, completed, isCurrent, isLocked, index }) => {
            const pos = nodePositions[index];
            const color = station.id === 'boss' ? '#2B3A8F' : SKILL_COLORS[station.skill];
            const radius = 28;

            return (
              <g key={station.id}>
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={completed ? color : isCurrent ? '#FFFBF5' : '#F3F4F6'}
                  stroke={isCurrent ? color : 'none'}
                  strokeWidth={isCurrent ? 3 : 0}
                  className={isCurrent && !reduceMotion ? 'animate-pulse' : ''}
                  style={{ opacity: isLocked ? 0.5 : 1 }}
                />

                {/* Badge icon inside node */}
                <g transform={`translate(${pos.x - 16}, ${pos.y - 16})`}>
                  <foreignObject width="32" height="32" x="0" y="0">
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {completed ? (
                        <CheckCircle2 size={24} className="text-white" />
                      ) : isLocked ? (
                        <Lock size={20} className="text-muted" />
                      ) : isCurrent ? (
                        <Play size={20} style={{ color }} />
                      ) : (
                        <Circle size={20} className="text-gray-300" />
                      )}
                    </div>
                  </foreignObject>
                </g>

                {/* Station label */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 18}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#12172B"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {station.name}
                </text>

                {/* Skill + XP */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 34}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                  fontFamily="Inter, sans-serif"
                >
                  {station.id === 'boss' ? 'Mixed skills' : `${SKILL_LABELS[station.skill]} · ${station.id === 'boss' ? '100' : getStationXP(station.skill)} XP`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Station list (accessible alternative to SVG map) */}
      <div className="space-y-2 mb-6">
        <h2 className="sr-only">Station list</h2>
        {stationStates.map(({ station, completed, isCurrent, isLocked }) => {
          const color = station.id === 'boss' ? '#2B3A8F' : SKILL_COLORS[station.skill];
          return (
            <button
              key={station.id}
              onClick={() => {
                if (isLocked) return;
                navigate(`/unit/${unit.id}/${levelKey}/${station.id}`);
              }}
              disabled={isLocked}
              className={`w-full flex items-center gap-4 p-4 rounded-card transition-all text-left ${
                isLocked
                  ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                  : completed
                    ? 'bg-white shadow-card hover:shadow-cardhover'
                    : isCurrent
                      ? 'bg-white shadow-card ring-2 ring-brand'
                      : 'bg-white shadow-card hover:shadow-cardhover'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`${station.name}. ${station.description}. ${completed ? 'Completed.' : isCurrent ? 'Current station.' : isLocked ? 'Locked.' : 'Available.'}`}
            >
              <StationBadge skill={station.id === 'boss' ? 'boss' : station.skill} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-700 text-ink text-sm sm:text-base">
                  {station.order}. {station.name}
                </p>
                <p className="text-xs text-muted truncate">{station.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {station.id !== 'boss' && (
                  <span
                    className="text-xs px-2 py-1 rounded-pill font-medium"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {SKILL_LABELS[station.skill]}
                  </span>
                )}
                {completed && <CheckCircle2 size={20} className="text-mint" />}
                {isCurrent && <Play size={20} className="text-brand" />}
                {isLocked && <Lock size={18} className="text-muted" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getStationXP(skill: string): number {
  const weights: Record<string, number> = {
    speaking: 25, vocabulary: 25, listening: 10, reading: 15, writing: 10, grammar: 15,
  };
  return weights[skill] || 0;
}
