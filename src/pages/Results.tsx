import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, RotateCcw, ArrowUp, Home, CheckCircle2, Sparkles } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { SKILL_COLORS, SKILL_LABELS, LEVEL_LABELS, type Skill } from '../types';
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
}

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
  const skillColor = SKILL_COLORS[state.skill as Skill] || '#2B3A8F';

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
        <h2 className="font-heading font-800 text-3xl text-ink mb-2">
          {state.isBoss ? 'Boss Complete!' : 'Station Complete!'}
        </h2>
        <p className="text-muted">{state.stationName}</p>
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
              className={s <= stars ? 'text-sun fill-sun' : 'text-gray-200'}
            />
          </motion.div>
        ))}
      </div>

      {/* XP earned */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4 text-center">
        <p className="text-sm text-muted mb-1">XP Earned</p>
        <p className="font-heading font-800 text-4xl text-brand tnum">
          +{state.xpEarned}
          <span className="text-lg text-muted ml-2">/ {state.xpTotal}</span>
        </p>
        <p className="text-sm text-muted mt-2 tnum">
          {state.correctCount} of {state.totalCount} correct ({accuracy}%)
        </p>
      </div>

      {/* Per-skill breakdown */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Skill Breakdown</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: skillColor }} />
          <span className="text-sm font-medium text-ink flex-1">{skillLabel}</span>
          <span className="text-sm tnum text-muted">
            {state.xpEarned} / {state.xpTotal} XP
          </span>
        </div>
        <div className="h-3 rounded-pill bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-pill transition-all duration-700"
            style={{
              width: `${(state.xpEarned / state.xpTotal) * 100}%`,
              backgroundColor: skillColor,
            }}
          />
        </div>
      </div>

      {/* Challenging unlocked notice */}
      {justUnlockedChallenging && (
        <div className="rounded-card p-4 mb-4 bg-sun/15 border border-sun/30">
          <p className="text-sm text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-sun" />
            <span className="font-medium">Challenging level unlocked!</span>
            You finished Core — the Challenging level is now available.
          </p>
        </div>
      )}

      {/* Badge */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: skillColor }}
        >
          <CheckCircle2 size={32} />
        </div>
        <div>
          <p className="font-heading font-700 text-ink">{state.stationName} Badge</p>
          <p className="text-sm text-muted">You completed all activities in this station.</p>
        </div>
      </div>

      {/* Look again — error list */}
      {state.errors.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <h3 className="font-heading font-700 text-lg text-ink mb-4">Look Again</h3>
          <div className="space-y-3">
            {state.errors.map((err, i) => (
              <div
                key={i}
                className="p-3 rounded-card bg-coral/5 border border-coral/20"
              >
                <p className="text-sm font-medium text-ink mb-1">
                  Correct: {err.correctAnswer}
                </p>
                <p className="text-sm text-muted">{err.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.errors.length === 0 && (
        <div className="bg-white rounded-card shadow-card p-6 mb-6 text-center">
          <CheckCircle2 size={32} className="text-mint mx-auto mb-2" />
          <p className="text-sm font-medium text-ink">No mistakes — perfect run!</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/unit/${state.unitId}/${state.level}/${state.stationId}`)}
          className="flex-1 py-3 rounded-pill bg-white shadow-card text-ink font-heading font-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
          style={{ minHeight: 44 }}
        >
          <RotateCcw size={18} /> Replay
        </button>

        {state.level !== 'challenging' && (
          <button
            onClick={() => navigate(`/unit/${state.unitId}/challenging`)}
            className="flex-1 py-3 rounded-pill bg-coral text-white font-heading font-700 hover:bg-coral/90 transition-colors inline-flex items-center justify-center gap-2"
            style={{ minHeight: 44 }}
          >
            <ArrowUp size={18} /> Try harder level
          </button>
        )}

        <button
          onClick={() => navigate(`/unit/${state.unitId}`)}
          className="flex-1 py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors inline-flex items-center justify-center gap-2"
          style={{ minHeight: 44 }}
        >
          <Home size={18} /> Back to unit
        </button>
      </div>
    </div>
  );
}
