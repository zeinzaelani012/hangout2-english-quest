import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { Lock, Unlock, AlertTriangle, KeyRound, BarChart3 } from 'lucide-react';
import { SKILL_LABELS, LEVEL_LABELS, type Level, type Skill } from '../types';

export function TeacherMode() {
  const { progress, settings, updateSettings, resetProgress } = useProgress();
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
      <div className="max-w-[400px] mx-auto px-4 sm:px-6 py-16">
        <h1 className="font-heading font-800 text-2xl text-ink mb-6 text-center">Teacher Mode</h1>
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
              <KeyRound size={28} className="text-brand" />
            </div>
          </div>
          <label htmlFor="teacher-pin" className="block text-sm font-medium text-ink mb-2 text-center">
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
            className="w-full px-4 py-3 rounded-pill border border-gray-200 bg-white text-ink text-center focus:outline-none focus:border-brand"
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
            className="w-full mt-4 py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors"
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
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-brand" />
        </div>
        <h1 className="font-heading font-800 text-2xl text-ink">Teacher Mode</h1>
      </div>

      {/* Per-level accuracy */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Level Performance</h3>
        {levelStats.length > 0 ? (
          <div className="space-y-3">
            {levelStats.map(stat => (
              <div key={stat.level} className="p-4 rounded-card bg-cream">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-700 text-ink">{LEVEL_LABELS[stat.level]}</p>
                  <span className="text-lg font-heading font-800 tnum text-brand">{stat.accuracy}%</span>
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
                        <div key={i} className="p-2 rounded-card bg-white border border-gray-100">
                          <p className="text-sm font-medium text-ink">Correct: {err.correctAnswer}</p>
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
      <div className="bg-white rounded-card shadow-card p-6 mb-4">
        <h3 className="font-heading font-700 text-lg text-ink mb-4">Controls</h3>
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

      {/* Reset progress */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4 border-2 border-coral/20">
        <h3 className="font-heading font-700 text-lg text-ink mb-2">Danger Zone</h3>
        <p className="text-sm text-muted mb-4">
          This will permanently delete all progress for the current student.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure? This will delete all progress and cannot be undone.')) {
              resetProgress();
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-coral text-white font-heading font-700 hover:bg-coral/90 transition-colors"
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
    <div className="flex items-center justify-between p-3 rounded-card bg-cream">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${checked ? 'bg-mint/15' : 'bg-gray-100'}`}>
          <Icon size={18} className={checked ? 'text-mint' : 'text-muted'} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-pill transition-colors ${checked ? 'bg-mint' : 'bg-gray-200'}`}
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
