import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, RotateCcw, ArrowUp, Home, CheckCircle2, Sparkles } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit } from '../data/units';
import { SKILL_COLORS, SKILL_LABELS, LEVEL_LABELS, type Skill } from '../types';
import { computeSkillAccuracy, accuracyBand } from '../lib/skillAccuracy';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ResultsState {
  unitId: number;
  level: string;
  stationId: string;
  stationName: string;
  skill: string;
  xpEarned: number;
  xpTotal: number;
  correctCount: number;
  totalCount: number;
  errors: { activityId: string; correctAnswer: string; rule: string }[];
  isBoss?: boolean;
  /** Station average under 25 s per activity — triggers the gentle nudge. */
  fastCompletion?: boolean;
}

const SKILL_ORDER: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];
const RATING_WORDS: Record<number, string> = { 1: 'Not yet', 2: 'Almost', 3: 'Yes' };

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCoreCompleted, progress } = useProgress();
  const reduceMotion = useReducedMotion();

  const state = location.state as ResultsState | null;

  if (!state) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-800 text-2xl text-ink mb-4">Results</h1>
        <p className="text-muted">No results to show. Go back to a unit to play.</p>
        <Link to="/" className="text-brand hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const accuracy = state.totalCount > 0 ? Math.round((state.correctCount / state.totalCount) * 100) : 0;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  const skillColor = SKILL_COLORS[state.skill as Skill] || '#0F766E';

  // PHASE 7 — the prediction-vs-work comparison. Computed from the stored
  // self-assessment record and the level's stored per-skill attempts. Hidden
  // entirely when the learner skipped the self-assessment.
  const record = progress.selfAssessments?.[`unit:${state.unitId}:level:${state.level}`];
  const comparison = (() => {
    if (!record || record.skipped) return null;
    const unit = getUnit(state.unitId);
    if (!unit) return null;
    const accuracyBySkill = computeSkillAccuracy(unit, state.level as Parameters<typeof computeSkillAccuracy>[1], progress);
    const rows = SKILL_ORDER.map(skill => {
      const rating = record.ratings[skill];
      const acc = accuracyBySkill[skill];
      let kind: 'aligned' | 'over' | 'under' = 'aligned';
      if (rating === 3 && acc.pct < 50) kind = 'over';
      else if (rating === 1 && acc.pct >= 70) kind = 'under';
      const gap = kind === 'over' ? 100 - acc.pct : kind === 'under' ? acc.pct : 0;
      return { skill, rating, acc, kind, gap };
    });
    const worstOver = rows.filter(r => r.kind === 'over').sort((a, b) => b.gap - a.gap)[0]?.skill;
    const bestUnder = rows.filter(r => r.kind === 'under').sort((a, b) => b.gap - a.gap)[0]?.skill;
    const lines = rows.map(r => ({
      skill: r.skill,
      rating: r.rating ?? 0,
      band: accuracyBand(r.acc.pct),
      kind: r.kind === 'over' && r.skill !== worstOver ? 'aligned'
        : r.kind === 'under' && r.skill !== bestUnder ? 'aligned'
          : r.kind,
    }));
    return { rows, lines, completedAt: record.completedAt };
  })();

  // Check if challenging was just unlocked
  const justUnlockedChallenging = state.level === 'core' && isCoreCompleted(state.unitId);

  // Per-skill earned vs available for this station
  const skillLabel = SKILL_LABELS[state.skill as Skill] || 'Mixed';

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="sr-only">Results</h1>

      {/* Celebratory header */}
      <motion.div
        initial={reduceMotion ? {} : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="inline-block mb-3">
          {!reduceMotion && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Sparkles size={40} className="text-sun mx-auto" />
            </motion.div>
          )}
          {reduceMotion && <Sparkles size={40} className="text-sun mx-auto" />}
        </div>
        <h2 className="mb-2 font-heading text-3xl font-extrabold text-ink">
          {state.isBoss ? 'Boss Complete!' : 'Station Complete!'}
        </h2>
        <p className="mt-1 text-sm font-semibold text-muted">{state.stationName}</p>
      </motion.div>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            initial={reduceMotion ? {} : { scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: s * 0.15, type: 'spring' }}
          >
            <Star
              size={48}
              className={s <= stars ? 'fill-sun text-sun' : 'text-slate-200'}
            />
          </motion.div>
        ))}
      </div>

      {/* XP earned */}
      <div className="surface-card mb-4 p-6 text-center">
        <p className="text-sm text-muted mb-1">XP Earned</p>
        <p className="font-heading font-800 text-4xl text-brand tnum">
          +{state.xpEarned}
          <span className="text-lg text-muted ml-2">/ {state.xpTotal}</span>
        </p>
        <p className="text-sm text-muted mt-2 tnum">
          {state.correctCount} of {state.totalCount} correct ({accuracy}%)
        </p>
        {/* Fast-completion nudge — gentle, never reduces XP */}
        {state.fastCompletion && (
          <p className="mt-3 text-sm text-muted">
            That was quick! Try reading the feedback next time - it helps the words stay.
          </p>
        )}
      </div>

      {/* PHASE 7 — prediction vs work comparison, above the per-skill bars.
          Hidden entirely when the self-assessment was skipped. */}
      {comparison && (
        <div className="surface-card mb-4 p-6">
          <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Your self-check</h3>
          <p className="mb-4 text-sm text-muted">
            What you predicted before seeing your score — next to what your work showed.
          </p>
          <div className="space-y-3">
            {comparison.lines.map(line => {
              const row = comparison.rows.find(r => r.skill === line.skill)!;
              const color = SKILL_COLORS[line.skill];
              return (
                <div key={line.skill} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                      <span className="text-sm font-extrabold text-ink">{SKILL_LABELS[line.skill]}</span>
                      <span className="flex items-center gap-0.5" role="img" aria-label={`Self-rated ${RATING_WORDS[line.rating] ?? 'skipped'}, ${line.rating} of 3`}>
                        {[1, 2, 3].map(d => (
                          <span
                            key={d}
                            className={`h-2.5 w-2.5 rounded-full ${d <= line.rating ? 'bg-brand' : 'bg-slate-300'}`}
                            aria-hidden
                          />
                        ))}
                      </span>
                      <span className="text-xs font-semibold text-muted">{RATING_WORDS[line.rating] ?? ''}</span>
                    </div>
                    <span className="text-xs font-bold text-muted">
                      Your work: {line.band}
                      <span className="sr-only"> ({row.acc.pct}% correct)</span>
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-sm font-medium ${
                      line.kind === 'over' ? 'text-sun' : line.kind === 'under' ? 'text-mint' : 'text-muted'
                    }`}
                  >
                    {line.kind === 'over'
                      ? 'This felt easier than it was. That is normal, and now you know where to look.'
                      : line.kind === 'under'
                        ? 'You can do more than you thought here.'
                        : 'Your self-check matches your work.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-skill breakdown */}
      <div className="surface-card mb-4 p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Skill breakdown</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: skillColor }} />
          <span className="flex-1 text-sm font-semibold text-ink">{skillLabel}</span>
          <span className="text-sm tnum text-muted">
            {state.xpEarned} / {state.xpTotal} XP
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(state.xpEarned / state.xpTotal) * 100}%`,
              backgroundColor: skillColor,
            }}
          />
        </div>
      </div>

      {/* Challenging unlocked notice */}
      {justUnlockedChallenging && (
        <div className="mb-4 rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-sun" />
            <span className="font-medium">Challenging level unlocked!</span>
            You finished Core — the Challenging level is now available.
          </p>
        </div>
      )}

      {/* Badge */}
      <div className="surface-card mb-4 flex items-center gap-4 p-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: skillColor }}
        >
          <CheckCircle2 size={32} />
        </div>
        <div>
          <p className="font-heading font-extrabold text-ink">{state.stationName} badge</p>
          <p className="text-sm text-muted">You completed all activities in this station.</p>
        </div>
      </div>

      {/* Look again — error list */}
      {state.errors.length > 0 && (
        <div className="surface-card mb-6 p-6">
          <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Review and improve</h3>
          <div className="space-y-3">
            {state.errors.map((err, i) => (
              <div
                key={i}
                className="rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <p className="mb-1 text-sm font-bold text-ink">
                  Correct: {err.correctAnswer}
                </p>
                <p className="text-sm text-muted">{err.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.errors.length === 0 && (
        <div className="surface-card mb-6 p-6 text-center">
          <CheckCircle2 size={32} className="text-mint mx-auto mb-2" />
          <p className="text-sm font-medium text-ink">No mistakes — perfect run!</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/unit/${state.unitId}/${state.level}/${state.stationId}`)}
          className="action-secondary flex-1"
          style={{ minHeight: 44 }}
        >
          <RotateCcw size={18} /> Replay
        </button>

        {state.level !== 'challenging' && (
          <button
            onClick={() => navigate(`/unit/${state.unitId}/challenging`)}
            className="action-accent flex-1"
            style={{ minHeight: 44 }}
          >
            <ArrowUp size={18} /> Try harder level
          </button>
        )}

        <button
          onClick={() => navigate(`/unit/${state.unitId}`)}
          className="action-primary flex-1"
          style={{ minHeight: 44 }}
        >
          <Home size={18} /> Back to unit
        </button>
      </div>
    </div>
  );
}
