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
        easy: '#2FB59A',
        core: '#2B3A8F',
        challenging: '#FF6B4A',
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
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      <h1 className="font-heading font-800 text-2xl text-ink mb-6">My Progress</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-card shadow-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-sun/15 flex items-center justify-center">
            <BookOpen size={22} className="text-sun" />
          </div>
          <div>
            <p className="font-heading font-800 text-2xl text-ink tnum">{wordsMastered}</p>
            <p className="text-sm text-muted">Words mastered</p>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-mint/15 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-mint" />
          </div>
          <div>
            <p className="font-heading font-800 text-2xl text-ink tnum">{activitiesCompleted}</p>
            <p className="text-sm text-muted">Activities completed</p>
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-coral/15 flex items-center justify-center">
            <Star size={22} className="text-coral" />
          </div>
          <div>
            <p className="font-heading font-800 text-2xl text-ink tnum">{starsEarned}</p>
            <p className="text-sm text-muted">Stars earned</p>
          </div>
        </div>
      </div>

      {/* Skill radar */}
      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Skill Profile</h3>
        <SkillRadar series={radarSeries} size={320} />
      </div>

      {/* Level history */}
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Level History</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice().reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-card bg-cream">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <Award size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">
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
                        className={s <= h.stars ? 'text-sun fill-sun' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                  <span className="text-sm tnum text-muted">{h.accuracy}%</span>
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
