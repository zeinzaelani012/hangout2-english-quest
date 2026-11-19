import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Flame, Lock, Play, Star } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { LEVEL_LABELS, SKILL_LABELS, SKILL_WEIGHTS, type Skill } from '../types';
import { AvatarSVG, SnackTableHero } from '../components/Illustrations';
import { ProgressRing } from '../components/ProgressRing';
import { SkillBar } from '../components/SkillBar';

interface DashboardProps {
  onEditProfile: () => void;
}

export function Dashboard({ onEditProfile }: DashboardProps) {
  const { profile, progress, getUnitProgress, getLevelProgressPercent } = useProgress();
  const navigate = useNavigate();

  if (!profile) return null;

  const firstUnit = units[0];
  const firstUnitProgress = getUnitProgress(1);
  const hasProgress = firstUnitProgress.completed > 0;
  const skills: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];
  const overallPercent = Math.round((firstUnitProgress.completed / firstUnitProgress.total) * 100);

  const skillEarned: Record<Skill, number> = {
    speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
  };
  const skillAvailable: Record<Skill, number> = {
    speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
  };

  for (const skill of skills) skillAvailable[skill] = SKILL_WEIGHTS[skill] * 3;

  if (progress.units[1]) {
    for (const level of ['easy', 'core', 'challenging'] as const) {
      const levelProgress = progress.units[1][level];
      if (!levelProgress) continue;
      for (const stationId of Object.keys(levelProgress.stations)) {
        const stationProgress = levelProgress.stations[stationId];
        const station = firstUnit.stations.find(item => item.id === stationId);
        if (station) skillEarned[station.skill as Skill] += stationProgress.xpEarned;
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">Dashboard</h1>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3.5">
          <button onClick={onEditProfile} className="rounded-xl transition-opacity hover:opacity-80" aria-label="Edit profile">
            <AvatarSVG avatarId={profile.avatarId} size={52} />
          </button>
          <div>
            <p className="eyebrow mb-1">Your learning space</p>
            <p className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">Welcome back, {profile.name}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:hidden">
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-ink">
            <Flame size={16} className="text-sun" /> <span className="tnum">{progress.streak} days</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-brand">
            <Star size={16} /> <span className="tnum">{progress.totalXP} XP</span>
          </div>
        </div>
      </section>

      <section className="surface-card mb-6 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-brand">UNIT 1</span>
              <span className="text-sm font-semibold text-muted">{firstUnit.islandName}</span>
            </div>
            <h2 className="max-w-2xl font-heading text-3xl font-extrabold text-ink sm:text-4xl">
              {hasProgress ? 'Continue where you left off' : 'Start your first English unit'}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted">
              {firstUnit.bigQuestion} Build speaking confidence through short, focused activities and immediate feedback.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button onClick={() => navigate('/unit/1')} className="action-accent sm:w-auto">
                {hasProgress ? <Play size={18} /> : <BookOpen size={18} />}
                {hasProgress ? 'Continue learning' : 'Open Unit 1'}
                <ArrowRight size={18} />
              </button>
              <div className="flex min-w-[180px] items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${overallPercent}%` }} />
                </div>
                <span className="tnum text-sm font-bold text-ink">{overallPercent}%</span>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-52 items-center justify-center overflow-hidden border-t border-slate-200 bg-slate-50 px-8 lg:border-l lg:border-t-0">
            <SnackTableHero className="h-auto w-full max-w-xs" />
          </div>
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
        <section className="surface-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">Unit 1 snapshot</p>
              <h2 className="font-heading text-xl font-extrabold text-ink">Overall progress</h2>
            </div>
            <button onClick={() => navigate('/progress')} className="text-sm font-bold text-brand hover:text-teal-800">View details</button>
          </div>
          <div className="flex items-center gap-6">
            <ProgressRing progress={overallPercent} size={112} label="Complete" />
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-ink">{firstUnitProgress.completed} stations complete</p>
                <p className="text-muted">out of {firstUnitProgress.total}</p>
              </div>
              <div>
                <p className="font-bold text-ink">{progress.totalXP} XP earned</p>
                <p className="text-muted">across your learning journey</p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="mb-5">
            <p className="eyebrow mb-1">Skill balance</p>
            <h2 className="font-heading text-xl font-extrabold text-ink">Your six English skills</h2>
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {skills.map(skill => (
              <SkillBar key={skill} skill={skill} earned={skillEarned[skill]} available={skillAvailable[skill]} showWeight />
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Course library</p>
            <h2 className="font-heading text-2xl font-extrabold text-ink">Choose a unit</h2>
          </div>
          <p className="hidden text-sm text-muted sm:block">
            {units.filter(u => u.status === 'playable').length} of {units.length} units available now
          </p>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map(unit => {
            if (unit.status === 'placeholder') {
              // Teacher Mode "Unlock all units": placeholders become openable
              // for preview (they still contain no activities).
              if (progress.settings.teacherUnlockAllUnits) {
                return (
                  <button
                    key={unit.id}
                    onClick={() => navigate(`/unit/${unit.id}`)}
                    className="surface-muted group flex min-h-44 flex-col justify-between p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
                    aria-label={`Unit ${unit.id}, preview unlocked, coming soon`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="eyebrow">Unit {unit.id}</span>
                      <span className="flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-1 text-[11px] font-extrabold text-brand">
                        <Play size={11} /> PREVIEW
                      </span>
                    </div>
                    <div>
                      <p className="font-heading text-lg font-bold text-ink">Coming soon</p>
                      <p className="mt-1 text-sm text-muted">Preview unlocked by Teacher Mode — no activities yet.</p>
                    </div>
                  </button>
                );
              }
              return (
                <div
                  key={unit.id}
                  tabIndex={0}
                  role="status"
                  className="surface-muted flex min-h-44 flex-col justify-between p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label={`Unit ${unit.id}, locked, coming soon`}
                >
                  <div className="flex items-start justify-between">
                    <span className="eyebrow">Unit {unit.id}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/70 text-slate-400"><Lock size={17} /></span>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-slate-500">Coming soon</p>
                    <p className="mt-1 text-sm text-muted">More English topics are being prepared.</p>
                  </div>
                </div>
              );
            }

            const easyPct = getLevelProgressPercent(unit.id, 'easy');
            const corePct = getLevelProgressPercent(unit.id, 'core');
            const challengingPct = getLevelProgressPercent(unit.id, 'challenging');
            const progressValues = { easy: easyPct, core: corePct, challenging: challengingPct };

            return (
              <button key={unit.id} onClick={() => navigate(`/unit/${unit.id}`)} className="surface-card group flex min-h-56 flex-col p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover" aria-label={`Unit ${unit.id}: ${unit.title}. ${unit.bigQuestion}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow mb-1">Unit {unit.id}</p>
                    <p className="font-heading text-xl font-extrabold text-ink">{unit.title}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-brand transition-colors group-hover:bg-brand group-hover:text-white"><BookOpen size={19} /></span>
                </div>
                <p className="mb-5 text-sm leading-6 text-muted">{unit.bigQuestion}</p>
                <div className="mt-auto space-y-2.5">
                  {(['easy', 'core', 'challenging'] as const).map(level => (
                    <div key={level} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-semibold text-muted">{LEVEL_LABELS[level]}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${progressValues[level]}%` }} />
                      </div>
                      <span className="tnum w-8 text-right text-xs font-bold text-ink">{progressValues[level]}%</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
