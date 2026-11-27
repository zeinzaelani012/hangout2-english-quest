import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Lock, Play, RotateCcw, Star } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit } from '../data/units';
import { SkillDonut } from '../components/SkillDonut';
import { durationLabel, lessonLabel, lessonMinutes } from '../lib/pacing';
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, type Level } from '../types';

export function UnitOverview() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { getLevelProgressPercent, isLevelCompleted, isCoreCompleted, progress, settings, isVocabIntroduced } = useProgress();
  const unit = getUnit(parseInt(unitId || '0'));
  const isUnitStarted =
    !!unit && (['easy', 'core', 'challenging'] as const).some(l => getLevelProgressPercent(unit.id, l) > 0);

  if (!unit) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Unit not available</h1>
        <p className="mt-2 text-muted">This unit does not exist.</p>
        <Link to="/" className="mt-5 inline-flex items-center gap-2 font-bold text-brand"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>
    );
  }

  if (unit.status === 'placeholder') {
    // Teacher Mode "Unlock all units" makes placeholder units openable for
    // preview; there is still nothing to play inside them.
    if (settings.teacherUnlockAllUnits) {
      return (
        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
          <p className="eyebrow mb-2">Preview unlocked by Teacher Mode</p>
          <h1 className="font-heading text-3xl font-extrabold text-ink">Unit {unit.id} — Coming soon</h1>
          <p className="mt-3 max-w-xl text-muted">
            This unit is being prepared. There are no activities to play yet — check back once its content pack is installed.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 font-bold text-brand"><ArrowLeft size={17} /> Back to dashboard</Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Unit not available</h1>
        <p className="mt-2 text-muted">This unit is coming soon.</p>
        <Link to="/" className="mt-5 inline-flex items-center gap-2 font-bold text-brand"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>
    );
  }

  const levels: Level[] = ['easy', 'core', 'challenging'];
  const challengingUnlocked = isCoreCompleted(unit.id) || !!settings.teacherUnlockChallenging;
  // Teacher Mode "Lock students to one level": learners stay on their current
  // Easy/Core level and cannot switch to the other one.
  const lockToOne = !!settings.teacherLockToOneLevel;
  const assignedLevel: Level = isLevelCompleted(unit.id, 'easy') ? 'core' : 'easy';

  // Per-level totals. Checkpoint/boss slots (expanded pack) count toward the
  // level's activity and XP totals; legacy boss items stay with their station.
  const levelMeta = (level: Level) => {
    const acts = unit.levels[level];
    const checkpoints = (unit.bossActivities?.[level] ?? []).filter(
      a => a.type === 'checkpoint' || a.type === 'boss',
    );
    const timingSet = [...acts, ...checkpoints];
    return {
      count: acts.length + checkpoints.length,
      xp: [...acts, ...checkpoints].reduce((sum, a) => sum + a.xp, 0),
      duration: durationLabel(timingSet, level),
      lesson: lessonLabel(timingSet, level),
      lessonMin: lessonMinutes(timingSet, level),
    };
  };
  const coreMeta = levelMeta('core');

  const levelAction = (level: Level) => {
    const percent = getLevelProgressPercent(unit.id, level);
    const complete = isLevelCompleted(unit.id, level);
    const gated = level === 'challenging' && !challengingUnlocked;
    const teacherLocked = lockToOne && (level === 'easy' || level === 'core') && level !== assignedLevel;

    if (teacherLocked) {
      return (
        <button disabled className="action-secondary w-full opacity-60" style={{ minHeight: 44 }}>
          <Lock size={17} /> Locked — stay on {LEVEL_LABELS[assignedLevel]}
        </button>
      );
    }
    if (gated) {
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
          <p className="mt-1 text-sm text-muted">Each level includes {coreMeta.count} activities and {coreMeta.xp} XP.</p>
        </div>

        <Link
          to={`/unit/${unit.id}/words`}
          className="surface-card group mb-4 flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-brand/10 text-brand">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="font-heading font-extrabold text-ink">
                Word introduction
                {!isUnitStarted && (
                  <span className="ml-2 rounded-pill bg-coral px-2 py-0.5 align-middle text-xs font-bold text-white">
                    Start here
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                Learn all {unit.vocabulary.length} words first — flip the cards, hear each word and its example.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-muted">
              {unit.vocabulary.filter(v => isVocabIntroduced(v.id)).length}/{unit.vocabulary.length}
            </p>
            <ChevronRight size={20} className="text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        <div className="grid gap-4 lg:grid-cols-3">
          {levels.map((level, index) => {
            const percent = getLevelProgressPercent(unit.id, level);
            const complete = isLevelCompleted(unit.id, level);
            const locked =
              (level === 'challenging' && !challengingUnlocked) ||
              (lockToOne && (level === 'easy' || level === 'core') && level !== assignedLevel);
            const stars = progress.units[unit.id]?.[level]?.stars || 0;
            const meta = levelMeta(level);

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

                <div className="mb-5 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {meta.duration && <span className="font-semibold text-ink">{meta.duration}</span>}
                      <span className="text-muted">·</span>
                      <span className="tnum font-semibold text-ink">{meta.xp} XP</span>
                      {/* Dev-only pacing flag: lesson total outside the 58–75 min target */}
                      {import.meta.env.DEV && (meta.lessonMin < 58 || meta.lessonMin > 75) && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                          check pacing
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1" aria-label={`${stars} of 3 stars`}>
                      {[1, 2, 3].map(star => <Star key={star} size={16} className={star <= stars ? 'fill-sun text-sun' : 'text-slate-200'} />)}
                    </div>
                  </div>
                  {meta.lesson && (
                    <p className="mt-1 text-xs text-muted">{meta.lesson}</p>
                  )}
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
