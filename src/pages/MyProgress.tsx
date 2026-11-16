import { useProgress } from '../context/ProgressContext';
import { SkillRadar } from '../components/SkillRadar';
import { vocabularyBank } from '../data/units';
import { SKILL_WEIGHTS, SKILL_LABELS, LEVEL_LABELS, type Skill, type Level } from '../types';
import { Star, BookOpen, CheckCircle2, Award } from 'lucide-react';

export function MyProgress() {
  const { progress, getVocabMastery } = useProgress();

  const skills: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];

  // Build radar series for each completed level
  const radarSeries = [];

  for (const level of ['easy', 'core', 'challenging'] as Level[]) {
    const lp = progress.units[1]?.[level];
    if (!lp) continue;

    const values: Record<Skill, number> = {
      speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
    };

    for (const skill of skills) {
      // Check if stations for this skill are completed
      // Vocabulary: station 'vocabulary', etc.
      const stationId = skill; // station id matches skill name
      const stationProg = lp.stations[stationId];
      if (stationProg && stationProg.completed) {
        values[skill] = 100;
      }
    }

    // Also check boss
    const boss = lp.stations['boss'];
    if (boss && boss.completed) {
      // Boss contributes to all skills
      for (const skill of skills) {
        values[skill] = Math.max(values[skill], 50);
      }
    }

    const hasData = Object.values(values).some(v => v > 0);
    if (hasData) {
      const colors: Record<Level, string> = {
        easy: '#168A72',
        core: '#0F766E',
        challenging: '#F05A47',
      };
      radarSeries.push({
        label: LEVEL_LABELS[level],
        values,
        color: colors[level],
      });
    }
  }

  // Stats
  const wordsMastered = vocabularyBank.filter(v => getVocabMastery(v.id) >= 2).length;
  const activitiesCompleted = Object.values(progress.units).reduce((sum, unit) => {
    return sum + Object.values(unit).reduce((s, level) => {
      return s + Object.values(level.stations).reduce((ss, station) => {
        return ss + Object.values(station.attempts).filter(a => a).length;
      }, 0);
    }, 0);
  }, 0);
  const starsEarned = progress.levelHistory.reduce((sum, h) => sum + h.stars, 0);

  // Level history
  const history = progress.levelHistory;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <p className="eyebrow mb-2">Learning record</p>
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-ink">My progress</h1>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface-card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <BookOpen size={22} className="text-sun" />
          </div>
          <div>
            <p className="tnum font-heading text-2xl font-extrabold text-ink">{wordsMastered}</p>
            <p className="text-sm font-semibold text-muted">Words mastered</p>
          </div>
        </div>
        <div className="surface-card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 size={22} className="text-mint" />
          </div>
          <div>
            <p className="font-heading font-800 text-2xl text-ink tnum">{activitiesCompleted}</p>
            <p className="text-sm font-semibold text-muted">Activities completed</p>
          </div>
        </div>
        <div className="surface-card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <Star size={22} className="text-coral" />
          </div>
          <div>
            <p className="font-heading font-800 text-2xl text-ink tnum">{starsEarned}</p>
            <p className="text-sm font-semibold text-muted">Stars earned</p>
          </div>
        </div>
      </div>

      {/* Skill radar */}
      <div className="surface-card mb-6 p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Skill profile</h3>
        <SkillRadar series={radarSeries} size={320} />
      </div>

      {/* Level history */}
      <div className="surface-card p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Level history</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice().reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                    <Award size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      Unit {h.unitId} · {LEVEL_LABELS[h.level]}
                    </p>
                    <p className="text-xs text-muted">{h.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        size={16}
                        className={s <= h.stars ? 'fill-sun text-sun' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <span className="tnum text-xs font-semibold text-muted">{h.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Complete a level to see your history here.</p>
        )}
      </div>
    </div>
  );
}
