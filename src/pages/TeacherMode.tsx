import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { Lock, Unlock, AlertTriangle, KeyRound, BarChart3, Presentation } from 'lucide-react';
import { SKILL_LABELS, LEVEL_LABELS, type Level, type Skill } from '../types';

export function TeacherMode() {
  const { progress, settings, updateSettings, resetProgress } = useProgress();
  const navigate = useNavigate();
  const [pinEntered, setPinEntered] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [toggles, setToggles] = useState({
    unlockAllUnits: false,
    unlockChallenging: false,
    lockToOneLevel: false,
  });

  const handlePinSubmit = () => {
    if (pinInput === settings.teacherPin) {
      setPinEntered(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Try again. (Default: teacher)');
    }
  };

  if (!pinEntered) {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow mb-2 text-center">Restricted area</p>
        <h1 className="mb-6 text-center font-heading text-3xl font-extrabold text-ink">Teacher mode</h1>
        <div className="surface-card p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <KeyRound size={28} className="text-brand" />
            </div>
          </div>
          <label htmlFor="teacher-pin" className="mb-2 block text-center text-sm font-bold text-ink">
            Enter PIN to continue
          </label>
          <input
            id="teacher-pin"
            type="password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            placeholder="PIN"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            style={{ minHeight: 44 }}
            aria-describedby={pinError ? 'pin-error' : undefined}
          />
          {pinError && (
            <p id="pin-error" className="mt-2 text-sm text-coral text-center" role="alert">
              {pinError}
            </p>
          )}
          <button
            onClick={handlePinSubmit}
            className="action-primary mt-4 w-full"
            style={{ minHeight: 44 }}
          >
            Enter
          </button>
          <p className="text-xs text-muted text-center mt-3">
            Default PIN is "teacher". You can change it in Settings.
          </p>
        </div>
      </div>
    );
  }

  // Calculate per-level accuracy and weakest skill
  const levelStats: { level: Level; accuracy: number; weakestSkill: Skill | null; errors: { activityId: string; correctAnswer: string; rule: string }[] }[] = [];

  for (const level of ['easy', 'core', 'challenging'] as Level[]) {
    const lp = progress.units[1]?.[level];
    if (!lp) continue;

    let total = 0;
    let correct = 0;
    const skillErrors: Record<Skill, number> = {
      speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
    };
    const allErrors: { activityId: string; correctAnswer: string; rule: string }[] = [];

    for (const [stationId, station] of Object.entries(lp.stations)) {
      for (const [activityId, isCorrect] of Object.entries(station.attempts)) {
        total++;
        if (isCorrect) correct++;
        else {
          const stationObj = units[0].stations.find(s => s.id === stationId);
          if (stationObj) {
            skillErrors[stationObj.skill]++;
          }
        }
      }
      allErrors.push(...station.errors);
    }

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const weakestSkill = (Object.entries(skillErrors) as [Skill, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    levelStats.push({ level, accuracy, weakestSkill, errors: allErrors });
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
          <BarChart3 size={20} className="text-brand" />
        </div>
        <div>
          <p className="eyebrow mb-0.5">Classroom tools</p>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Teacher mode</h1>
        </div>
      </div>

      {/* Per-level accuracy */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Level performance</h3>
        {levelStats.length > 0 ? (
          <div className="space-y-3">
            {levelStats.map(stat => (
              <div key={stat.level} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-extrabold text-ink">{LEVEL_LABELS[stat.level]}</p>
                  <span className="tnum font-heading text-lg font-extrabold text-brand">{stat.accuracy}%</span>
                </div>
                {stat.weakestSkill && (
                  <p className="text-sm text-muted">
                    Weakest skill: <span className="font-medium text-ink">{SKILL_LABELS[stat.weakestSkill]}</span>
                  </p>
                )}
                {stat.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-brand cursor-pointer hover:underline">
                      View {stat.errors.length} error(s)
                    </summary>
                    <div className="mt-2 space-y-2">
                      {stat.errors.map((err, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-sm font-bold text-ink">Correct: {err.correctAnswer}</p>
                          <p className="text-xs text-muted">{err.rule}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No level data yet. Students need to complete activities first.</p>
        )}
      </div>

      {/* Controls */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Classroom controls</h3>
        <div className="space-y-3">
          <ToggleRow
            label="Unlock all units"
            description="Make Units 2–9 available (placeholder content)"
            checked={toggles.unlockAllUnits}
            onChange={v => setToggles(prev => ({ ...prev, unlockAllUnits: v }))}
            icon={Unlock}
          />
          <ToggleRow
            label="Unlock Challenging level"
            description="Remove the Core completion requirement"
            checked={toggles.unlockChallenging}
            onChange={v => setToggles(prev => ({ ...prev, unlockChallenging: v }))}
            icon={Unlock}
          />
          <ToggleRow
            label="Lock students to one level"
            description="Prevent switching between Easy and Core"
            checked={toggles.lockToOneLevel}
            onChange={v => setToggles(prev => ({ ...prev, lockToOneLevel: v }))}
            icon={Lock}
          />
        </div>
      </div>

      {/* Present mode */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Present mode</h3>
        <p className="text-sm text-muted mb-4">
          Show one activity per screen for the whole class — large text, answer options revealed
          with the number keys 1–4, and a big Next button. No XP, nothing is saved.
        </p>
        <button
          onClick={() => navigate('/teacher/present')}
          className="action-primary"
          style={{ minHeight: 44 }}
        >
          <Presentation size={18} /> Start presenting
        </button>
      </div>

      {/* Reset progress */}
      <div className="surface-card mb-4 border-red-200 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Danger zone</h3>
        <p className="text-sm text-muted mb-4">
          This will permanently delete all progress for the current student.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure? This will delete all progress and cannot be undone.')) {
              resetProgress();
            }
          }}
          className="action-accent"
          style={{ minHeight: 44 }}
        >
          <AlertTriangle size={18} /> Reset this student's progress
        </button>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

function ToggleRow({ label, description, checked, onChange, icon: Icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-emerald-50' : 'bg-slate-200/60'}`}>
          <Icon size={18} className={checked ? 'text-mint' : 'text-muted'} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-mint' : 'bg-slate-300'}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{ minWidth: 44 }}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
