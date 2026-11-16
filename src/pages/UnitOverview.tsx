import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, Play, RotateCcw, Star } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit } from '../data/units';
import { SkillDonut } from '../components/SkillDonut';
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, type Level } from '../types';

export function UnitOverview() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { getLevelProgressPercent, isLevelCompleted, isCoreCompleted, progress } = useProgress();
  const unit = getUnit(parseInt(unitId || '0'));

  if (!unit || unit.status === 'placeholder') {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Unit not available</h1>
        <p className="mt-2 text-muted">This unit is coming soon.</p>
        <Link to="/" className="mt-5 inline-flex items-center gap-2 font-bold text-brand"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>
    );
  }

  const levels: Level[] = ['easy', 'core', 'challenging'];
  const teacherUnlockChallenging = progress.settings.teacherPin && progress.units[unit.id]?.challenging;
  const challengingUnlocked = isCoreCompleted(unit.id) || !!teacherUnlockChallenging;

  const levelAction = (level: Level) => {
    const percent = getLevelProgressPercent(unit.id, level);
    const complete = isLevelCompleted(unit.id, level);
    const locked = level === 'challenging' && !challengingUnlocked;

    if (locked) {
      return <button onClick={() => navigate(`/unit/${unit.id}/core`)} className="action-secondary w-full">Finish Core first</button>;
    }
    if (complete) {
      return <button onClick={() => navigate(`/unit/${unit.id}/${level}`)} className="action-secondary w-full"><RotateCcw size={17} /> Replay level</button>;
    }
    return (
      <button onClick={() => navigate(`/unit/${unit.id}/${level}`)} className={`${percent > 0 ? 'action-primary' : 'action-accent'} w-full`}>
        <Play size={17} /> {percent > 0 ? 'Continue level' : 'Start level'}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="font-semibold hover:text-brand">Dashboard</Link>
        <ChevronRight size={14} />
        <span className="font-semibold text-ink">Unit {unit.id}</span>
      </nav>

      <section className="surface-card mb-6 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="p-6 sm:p-8">
            <p className="eyebrow mb-2">Unit {unit.id} · {unit.islandName}</p>
            <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">{unit.title}</h1>
            <p className="mt-4 max-w-2xl font-heading text-xl font-bold leading-8 text-brand sm:text-2xl">{unit.bigQuestion}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {unit.objectives.map(objective => (
                <span key={objective} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">{objective}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <div className="text-center">
              <p className="eyebrow mb-4">Skill mix</p>
              <SkillDonut size={184} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="eyebrow mb-1">Learning path</p>
          <h2 className="font-heading text-2xl font-extrabold text-ink">Choose your level</h2>
          <p className="mt-1 text-sm text-muted">Each level includes 20 activities and 100 XP.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {levels.map((level, index) => {
            const percent = getLevelProgressPercent(unit.id, level);
            const complete = isLevelCompleted(unit.id, level);
            const locked = level === 'challenging' && !challengingUnlocked;
            const stars = progress.units[unit.id]?.[level]?.stars || 0;

            return (
              <article key={level} className={`surface-card flex flex-col p-5 ${locked ? 'bg-slate-50/80' : ''}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-heading text-sm font-extrabold ${locked ? 'bg-slate-200 text-slate-500' : complete ? 'bg-emerald-50 text-mint' : 'bg-teal-50 text-brand'}`}>
                      {locked ? <Lock size={18} /> : complete ? <CheckCircle2 size={19} /> : index + 1}
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-extrabold text-ink">{LEVEL_LABELS[level]}</h3>
                      <p className="text-xs font-semibold text-muted">{LEVEL_DESCRIPTIONS[level]}</p>
                    </div>
                  </div>
                  {complete && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-mint">Complete</span>}
                </div>

                <p className="mb-5 min-h-12 text-sm leading-6 text-muted">
                  {level === 'easy' && 'Build confidence with visual support, audio, and guided choices.'}
                  {level === 'core' && 'Practice the full language set through varied activities and games.'}
                  {level === 'challenging' && (locked ? 'Complete Core to unlock this independent challenge.' : 'Work with longer texts, fewer hints, and harder choices.')}
                </p>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted">Progress</span>
                    <span className="tnum text-ink">{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="mb-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="font-semibold text-ink">100 XP</span>
                  <div className="flex gap-1" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map(star => <Star key={star} size={16} className={star <= stars ? 'fill-sun text-sun' : 'text-slate-200'} />)}
                  </div>
                </div>
                <div className="mt-auto">{levelAction(level)}</div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
