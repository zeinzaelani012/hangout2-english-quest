import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Lock, Star, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit } from '../data/units';
import { SkillDonut } from '../components/SkillDonut';
import { LEVEL_LABELS, LEVEL_DESCRIPTIONS, type Level } from '../types';

export function UnitOverview() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { getLevelProgressPercent, isLevelCompleted, isCoreCompleted, progress } = useProgress();

  const unit = getUnit(parseInt(unitId || '0'));

  if (!unit || unit.status === 'placeholder') {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-800 text-2xl text-ink mb-4">Unit Not Available</h1>
        <p className="text-muted">This unit is coming soon.</p>
        <Link to="/" className="inline-flex items-center gap-1 text-brand mt-4 hover:underline">
          Back to Dashboard <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const levels: Level[] = ['easy', 'core', 'challenging'];
  const coreDone = isCoreCompleted(unit.id);

  const teacherUnlockChallenging = progress.settings.teacherPin && progress.units[unit.id]?.challenging;

  const isChallengingUnlocked = coreDone || !!teacherUnlockChallenging;

  const getLevelButton = (level: Level) => {
    const pct = getLevelProgressPercent(unit.id, level);
    const completed = isLevelCompleted(unit.id, level);

    if (level === 'challenging' && !isChallengingUnlocked) {
      return (
        <button
          onClick={() => navigate(`/unit/${unit.id}/core`)}
          className="w-full py-2.5 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors text-sm"
          style={{ minHeight: 44 }}
        >
          Go to Core
        </button>
      );
    }

    if (completed) {
      return (
        <button
          onClick={() => navigate(`/unit/${unit.id}/${level}`)}
          className="w-full py-2.5 rounded-pill bg-mint text-white font-heading font-700 hover:bg-mint/90 transition-colors text-sm inline-flex items-center justify-center gap-1.5"
          style={{ minHeight: 44 }}
        >
          <RotateCcw size={16} /> Replay
        </button>
      );
    }

    if (pct > 0) {
      return (
        <button
          onClick={() => navigate(`/unit/${unit.id}/${level}`)}
          className="w-full py-2.5 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors text-sm inline-flex items-center justify-center gap-1.5"
          style={{ minHeight: 44 }}
        >
          <Play size={16} /> Continue
        </button>
      );
    }

    return (
      <button
        onClick={() => navigate(`/unit/${unit.id}/${level}`)}
        className="w-full py-2.5 rounded-pill bg-coral text-white font-heading font-700 hover:bg-coral/90 transition-colors text-sm inline-flex items-center justify-center gap-1.5"
        style={{ minHeight: 44 }}
      >
        <Play size={16} /> Start
      </button>
    );
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted mb-4" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand">Dashboard</Link>
        <ChevronRight size={14} />
        <span className="text-ink font-medium">Unit {unit.id}: {unit.title}</span>
      </nav>

      <h1 className="font-heading font-800 text-3xl text-ink mb-1">{unit.title}</h1>
      <p className="text-muted mb-6">{unit.islandName}</p>

      {/* Big Question */}
      <div
        className="rounded-card p-8 mb-6 text-center shadow-card"
        style={{
          background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF0E0 50%, #FFC14520 100%)',
        }}
      >
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Big Question</p>
        <p className="font-heading font-800 text-2xl sm:text-3xl text-ink">{unit.bigQuestion}</p>
      </div>

      {/* Objectives */}
      <div className="flex flex-wrap gap-2 mb-6">
        {unit.objectives.map((obj, i) => (
          <span
            key={i}
            className="px-4 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink"
          >
            {obj}
          </span>
        ))}
      </div>

      {/* Skill donut */}
      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Skill Mix</h3>
        <SkillDonut size={200} />
      </div>

      {/* Level cards */}
      <h3 className="font-heading font-700 text-lg text-ink mb-4">Choose Your Level</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {levels.map(level => {
          const pct = getLevelProgressPercent(unit.id, level);
          const completed = isLevelCompleted(unit.id, level);
          const locked = level === 'challenging' && !isChallengingUnlocked;
          const stars = progress.units[unit.id]?.[level]?.stars || 0;

          if (locked) {
            return (
              <div
                key={level}
                className="rounded-card bg-white/70 border-2 border-gray-100 p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Lock size={18} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-heading font-700 text-ink">{LEVEL_LABELS[level]}</p>
                    <p className="text-xs text-muted">{LEVEL_DESCRIPTIONS[level]}</p>
                  </div>
                </div>
                <p className="text-sm text-muted mb-4">Finish Core to unlock</p>
                <div className="mt-auto">{getLevelButton(level)}</div>
              </div>
            );
          }

          return (
            <div
              key={level}
              className="rounded-card bg-white shadow-card p-5 flex flex-col hover:shadow-cardhover transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-heading font-700 text-ink">{LEVEL_LABELS[level]}</p>
                  <p className="text-xs text-muted">{LEVEL_DESCRIPTIONS[level]}</p>
                </div>
                {completed && (
                  <CheckCircle2 size={20} className="text-mint" />
                )}
              </div>

              <p className="text-sm text-muted mb-3">
                {level === 'easy' && 'Learn the basics with pictures and audio support.'}
                {level === 'core' && 'Practice with the full set of activities and games.'}
                {level === 'challenging' && 'Test yourself with harder texts and fewer hints.'}
              </p>

              <div className="flex items-center gap-2 text-sm mb-3">
                <span className="font-medium text-ink">100 XP</span>
                <span className="text-muted">·</span>
                <span className="text-muted">20 activities</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-pill bg-gray-100 overflow-hidden mb-2">
                <div
                  className="h-full rounded-pill bg-brand transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted mb-3 tnum">{pct}% complete</p>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= stars ? 'text-sun fill-sun' : 'text-gray-200'}
                  />
                ))}
              </div>

              <div className="mt-auto">{getLevelButton(level)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
