import { useNavigate } from 'react-router-dom';
import { Flame, Star, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { SKILL_WEIGHTS, SKILL_LABELS, type Skill } from '../types';
import { SnackTableHero, AvatarSVG } from '../components/Illustrations';
import { ProgressRing } from '../components/ProgressRing';
import { SkillBar } from '../components/SkillBar';
import { LEVEL_LABELS } from '../types';

interface DashboardProps {
  onEditProfile: () => void;
}

export function Dashboard({ onEditProfile }: DashboardProps) {
  const { profile, progress, getUnitProgress, getLevelProgressPercent } = useProgress();
  const navigate = useNavigate();

  if (!profile) return null;

  const unit1 = units[0];
  const unit1Progress = getUnitProgress(1);
  const hasProgress = unit1Progress.completed > 0;

  const skills: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];

  // Calculate overall progress
  const overallPercent = Math.round((unit1Progress.completed / unit1Progress.total) * 100);

  // Per-skill earned vs available across all levels
  const skillEarned: Record<Skill, number> = {
    speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
  };
  const skillAvailable: Record<Skill, number> = {
    speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
  };

  // Each level has 100 XP, split by skill weights
  // 3 levels total for unit 1
  for (const skill of skills) {
    skillAvailable[skill] = SKILL_WEIGHTS[skill] * 3; // 3 levels
  }

  // Calculate earned from progress
  if (progress.units[1]) {
    for (const level of ['easy', 'core', 'challenging'] as const) {
      const lp = progress.units[1][level];
      if (lp) {
        for (const stationId of Object.keys(lp.stations)) {
          const station = lp.stations[stationId];
          const stationObj = unit1.stations.find(s => s.id === stationId);
          if (stationObj) {
            const skill = stationObj.skill as Skill;
            skillEarned[skill] += station.xpEarned;
          }
        }
      }
    }
  }

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
      <h1 className="sr-only">Dashboard</h1>

      {/* Greeting */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center gap-3">
          <button onClick={onEditProfile} className="hover:opacity-80 transition-opacity" aria-label="Edit profile">
            <AvatarSVG avatarId={profile.avatarId} size={48} />
          </button>
          <div>
            <p className="text-sm text-muted">Welcome back</p>
            <p className="font-heading font-800 text-2xl text-ink">Hi, {profile.name}!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-sun/15">
            <Flame size={16} className="text-sun" />
            <span className="text-sm font-medium tnum text-ink">{progress.streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-brand/10">
            <Star size={16} className="text-brand" />
            <span className="text-sm font-medium tnum text-brand">{progress.totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand to-brand/80 shadow-card mb-6">
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="font-heading font-800 text-3xl sm:text-4xl text-white mb-2">
              Your English Quest
            </h2>
            <p className="text-white/80 text-base mb-4 max-w-md">
              Learn new words, play games, and become an English star — one unit at a time.
            </p>
            <button
              onClick={() => navigate('/unit/1')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-coral text-white font-heading font-700 hover:bg-coral/90 transition-colors shadow-lg"
              style={{ minHeight: 44 }}
            >
              {hasProgress ? 'Continue Unit 1' : 'Start Unit 1'}
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="w-full sm:w-1/2 max-w-sm">
            <SnackTableHero className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Skill panel */}
      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Your Skills</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing progress={overallPercent} size={120} label="Complete" />
          <div className="flex-1 w-full space-y-3">
            {skills.map(skill => (
              <SkillBar
                key={skill}
                skill={skill}
                earned={skillEarned[skill]}
                available={skillAvailable[skill]}
                showWeight
              />
            ))}
          </div>
        </div>
      </div>

      {/* Choose a Unit */}
      <div className="mb-6">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Choose a Unit</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(unit => {
            if (unit.status === 'placeholder') {
              return (
                <div
                  key={unit.id}
                  className="rounded-card bg-white/70 border border-gray-100 p-5 flex flex-col items-center justify-center text-center cursor-not-allowed"
                  style={{ opacity: 0.7, minHeight: 200 }}
                  aria-label={`Unit ${unit.id}, locked, coming soon`}
                  tabIndex={0}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Lock size={20} className="text-muted" />
                  </div>
                  <p className="font-heading font-700 text-ink">Unit {unit.id}</p>
                  <p className="text-sm text-muted mt-1">Coming soon</p>
                </div>
              );
            }

            const uProgress = getUnitProgress(unit.id);
            const easyPct = getLevelProgressPercent(unit.id, 'easy');
            const corePct = getLevelProgressPercent(unit.id, 'core');
            const chalPct = getLevelProgressPercent(unit.id, 'challenging');

            return (
              <button
                key={unit.id}
                onClick={() => navigate(`/unit/${unit.id}`)}
                className="text-left rounded-card bg-white shadow-card hover:shadow-cardhover transition-all p-5 group"
                aria-label={`Unit ${unit.id}: ${unit.title}. ${unit.bigQuestion}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted font-medium">Unit {unit.id}</p>
                    <p className="font-heading font-800 text-lg text-ink">{unit.title}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                    <BookOpen size={18} />
                  </div>
                </div>
                <p className="text-sm text-muted mb-4 italic">"{unit.bigQuestion}"</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['easy', 'core', 'challenging'] as const).map(level => {
                    const pct = level === 'easy' ? easyPct : level === 'core' ? corePct : chalPct;
                    return (
                      <span
                        key={level}
                        className="text-xs px-2.5 py-1 rounded-pill font-medium"
                        style={{
                          backgroundColor: pct > 0 ? '#2FB59A15' : '#F3F4F6',
                          color: pct > 0 ? '#2FB59A' : '#6B7280',
                        }}
                      >
                        {LEVEL_LABELS[level]} {pct}%
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
