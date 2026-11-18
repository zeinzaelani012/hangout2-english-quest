import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { Lock, Unlock, AlertTriangle, KeyRound, BarChart3, Presentation, Timer, ClipboardCheck, BarChart3 as ChartIcon, Download } from 'lucide-react';
import { SKILL_LABELS, LEVEL_LABELS, SKILL_COLORS, type Level, type Skill, type LevelTiming, type SelfAssessmentRecord, type ProgressData } from '../types';
import { computeSkillAccuracy } from '../lib/skillAccuracy';
import { buildSelfCheckCsv, selfCheckFlag } from '../lib/selfCheckCsv';

export function TeacherMode() {
  const { progress, settings, updateSettings, resetProgress } = useProgress();
  const navigate = useNavigate();
  const [pinEntered, setPinEntered] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [toggles, setToggles] = useState({
    unlockAllUnits: settings.teacherUnlockAllUnits ?? false,
    unlockChallenging: settings.teacherUnlockChallenging ?? false,
    lockToOneLevel: settings.teacherLockToOneLevel ?? false,
  });
  const [tab, setTab] = useState<'overview' | 'pacing' | 'selfcheck'>('overview');

  // Toggles are real settings: they persist and every page reads them.
  const SETTING_KEYS = {
    unlockAllUnits: 'teacherUnlockAllUnits',
    unlockChallenging: 'teacherUnlockChallenging',
    lockToOneLevel: 'teacherLockToOneLevel',
  } as const;
  const handleToggle = (key: keyof typeof SETTING_KEYS, value: boolean) => {
    setToggles(prev => ({ ...prev, [key]: value }));
    updateSettings({ [SETTING_KEYS[key]]: value });
  };

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
        <div className="flex-1">
          <p className="eyebrow mb-0.5">Classroom tools</p>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Teacher mode</h1>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-pill bg-slate-100 p-1">
          <button
            onClick={() => setTab('overview')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'overview' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'overview'}
          >
            <ChartIcon size={14} /> Overview
          </button>
          <button
            onClick={() => setTab('pacing')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'pacing' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'pacing'}
          >
            <Timer size={14} /> Pacing
          </button>
          <button
            onClick={() => setTab('selfcheck')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'selfcheck' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'selfcheck'}
          >
            <ClipboardCheck size={14} /> Self-check
          </button>
        </div>
      </div>

      {tab === 'pacing' ? (
        <PacingTab levelTimings={progress.levelTimings ?? {}} />
      ) : tab === 'selfcheck' ? (
        <SelfCheckTab progress={progress} />
      ) : (
        <>
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
            description="Make Units 3–9 openable for preview (they are coming-soon placeholders)"
            checked={toggles.unlockAllUnits}
            onChange={v => handleToggle('unlockAllUnits', v)}
            icon={Unlock}
          />
          <ToggleRow
            label="Unlock Challenging level"
            description="Remove the Core completion requirement"
            checked={toggles.unlockChallenging}
            onChange={v => handleToggle('unlockChallenging', v)}
            icon={Unlock}
          />
          <ToggleRow
            label="Lock students to one level"
            description="Prevent switching between Easy and Core"
            checked={toggles.lockToOneLevel}
            onChange={v => handleToggle('lockToOneLevel', v)}
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
        </>
      )}
    </div>
  );
}

/**
 * PACING TAB — timing telemetry per unit and level (localStorage only).
 * Median total minutes, median seconds per station, the two fastest stations
 * (the ones to deepen), and the attempts flagged fast_completion.
 */
function PacingTab({ levelTimings }: { levelTimings: Record<number, LevelTiming[]> }) {
  const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  const hasAny = Object.values(levelTimings).some(list => (list?.length ?? 0) > 0);
  if (!hasAny) {
    return (
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Pacing</h3>
        <p className="text-sm text-muted">
          No completed level attempts yet. Timing is recorded when a student finishes all stations of a level.
        </p>
      </div>
    );
  }

  const stationLabels: Record<string, string> = {
    vocabulary: 'Vocabulary', grammar: 'Grammar', listening: 'Listening',
    reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
    boss: 'Boss', checkpoint: 'Checkpoint',
  };

  return (
    <>
      {Object.entries(levelTimings).map(([unitIdRaw, timings]) => {
        const unitId = Number(unitIdRaw);
        const unit = units.find(u => u.id === unitId);
        const levels = (['easy', 'core', 'challenging'] as Level[]).filter(
          level => (timings ?? []).some(t => t.level === level),
        );
        if (levels.length === 0) return null;

        return (
          <div key={unitIdRaw} className="surface-card mb-4 p-5 sm:p-6">
            <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Pacing — Unit {unitId}{unit ? `: ${unit.title}` : ''}</h3>
            <p className="text-sm text-muted mb-4">
              Timing is recorded when a full level attempt finishes. Fast flag: average under 25 s per activity.
            </p>

            {levels.map(level => {
              const attempts = (timings ?? []).filter(t => t.level === level);
              const totalMinutes = attempts.map(t =>
                Object.values(t.perStation).reduce((sum, s) => sum + s.seconds, 0) / 60,
              );
              const medianMinutes = median(totalMinutes);

              // Union of station keys across attempts
              const stationKeys = [...new Set(attempts.flatMap(t => Object.keys(t.perStation)))];
              const stationRows = stationKeys.map(key => {
                const values = attempts.map(t => t.perStation[key]?.seconds).filter((s): s is number => typeof s === 'number');
                const activities = attempts.map(t => t.perStation[key]?.activities).filter((a): a is number => typeof a === 'number');
                const medSeconds = median(values);
                const medActivities = median(activities);
                return {
                  key,
                  attempts: values.length,
                  medSeconds,
                  perActivity: medActivities > 0 ? medSeconds / medActivities : medSeconds,
                };
              });
              const fastestTwo = [...stationRows].sort((a, b) => a.perActivity - b.perActivity).slice(0, 2);
              const fastestKeys = new Set(fastestTwo.map(s => s.key));

              const flagged = attempts.filter(t => t.fastCompletion);

              return (
                <div key={level} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 last:mb-0">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-heading font-extrabold text-ink">{LEVEL_LABELS[level]}</p>
                    <p className="tnum text-sm font-bold text-ink">
                      Median total: {medianMinutes.toFixed(1)} min · {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-muted">
                        <th className="pb-2 pr-2 font-bold">Station</th>
                        <th className="pb-2 pr-2 font-bold tnum">Attempts</th>
                        <th className="pb-2 pr-2 font-bold tnum">Median seconds</th>
                        <th className="pb-2 font-bold tnum">Median s / activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stationRows.map(row => (
                        <tr key={row.key} className="border-t border-slate-200">
                          <td className="py-2 pr-2 font-semibold text-ink">
                            {stationLabels[row.key] ?? row.key}
                            {fastestKeys.has(row.key) && (
                              <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                                deepen this
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-2 tnum text-muted">{row.attempts}</td>
                          <td className="py-2 pr-2 tnum text-ink">{Math.round(row.medSeconds)}s</td>
                          <td className="py-2 tnum text-ink">{row.perActivity.toFixed(1)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="mt-3 text-sm text-muted">
                    Fastest stations (to deepen):{' '}
                    <span className="font-semibold text-ink">
                      {fastestTwo.map(s => stationLabels[s.key] ?? s.key).join(', ') || '—'}
                    </span>
                  </p>

                  <p className="mt-2 text-sm text-muted">
                    Flagged fast_completion: <span className="tnum font-bold text-ink">{flagged.length}</span>
                    {flagged.length > 0 && (
                      <span className="block mt-1 text-xs">
                        {flagged.map((t, i) => (
                          <span key={i} className="mr-2 inline-block rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
                            {LEVEL_LABELS[t.level]} · {new Date(t.endedAt).toLocaleDateString()} ·{' '}
                            {(Object.values(t.perStation).reduce((sum, s) => sum + s.seconds, 0) / 60).toFixed(1)} min
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
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

/**
 * SELF-CHECK TAB — the prediction-vs-work report. One row per skill per
 * self-assessment record: the learner's rating (dots) beside their actual
 * accuracy, a flag column (high/low), the hardest choice and the note as
 * written. Plain table, no charts library.
 */
const SELF_CHECK_SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

function RatingDots({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" role="img" aria-label={`${rating} of 3`}>
      {[1, 2, 3].map(d => (
        <span key={d} className={`h-2.5 w-2.5 rounded-full ${d <= rating ? 'bg-brand' : 'bg-slate-300'}`} aria-hidden />
      ))}
    </span>
  );
}

function SelfCheckTab({ progress }: { progress: ProgressData }) {
  const learnerName = 'this learner';
  const resolveSkill = (unitId: number, stationId: string): Skill | undefined =>
    units.find(u => u.id === unitId)?.stations.find(s => s.id === stationId)?.skill;

  const records = Object.entries(progress.selfAssessments ?? {})
    .map(([key, record]) => ({ key, record }))
    .sort((a, b) => a.record.completedAt - b.record.completedAt);

  const isOver = (r: SelfAssessmentRecord): boolean =>
    !r.skipped && SELF_CHECK_SKILLS.some(skill => {
      const pct = computeSkillAccuracy(units.find(u => u.id === r.unit)!, r.level, progress)[skill].pct;
      return r.ratings[skill] === 3 && pct < 50;
    });
  const isUnder = (r: SelfAssessmentRecord): boolean =>
    !r.skipped && SELF_CHECK_SKILLS.some(skill => {
      const pct = computeSkillAccuracy(units.find(u => u.id === r.unit)!, r.level, progress)[skill].pct;
      return r.ratings[skill] === 1 && pct >= 70;
    });

  const overCount = records.filter(({ record }) => isOver(record)).length;
  const underCount = records.filter(({ record }) => isUnder(record)).length;

  const downloadCsv = () => {
    const csv = buildSelfCheckCsv(progress, 'learner', resolveSkill);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'self-check.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (records.length === 0) {
    return (
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Self-check</h3>
        <p className="text-sm text-muted">
          No self-assessments yet. Learners rate themselves after each level's BOSS, before they see
          their score — that is what makes the rating a prediction worth comparing.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card mb-4 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-extrabold text-ink">Self-check</h3>
        <button onClick={downloadCsv} className="action-secondary text-sm" style={{ minHeight: 40 }}>
          <Download size={15} className="inline" /> Export CSV
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="tnum font-heading text-2xl font-extrabold text-ink">{overCount}</p>
          <p className="text-xs font-semibold text-muted">rated themselves higher than their work, in at least one skill</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="tnum font-heading text-2xl font-extrabold text-ink">{underCount}</p>
          <p className="text-xs font-semibold text-muted">rated themselves lower than their work, in at least one skill</p>
        </div>
      </div>

      <div className="space-y-5">
        {records.map(({ key, record }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-heading font-extrabold text-ink">
                Unit {record.unit} · {LEVEL_LABELS[record.level]}
              </p>
              <p className="text-xs font-semibold text-muted">
                {record.skipped
                  ? 'Skipped'
                  : `Completed ${new Date(record.completedAt).toLocaleDateString()}`}
              </p>
            </div>
            {record.skipped ? (
              <p className="text-sm text-muted">This attempt skipped the self-check.</p>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-muted">
                      <th className="pb-2 pr-2 font-bold">Skill</th>
                      <th className="pb-2 pr-2 font-bold">Self rating</th>
                      <th className="pb-2 pr-2 font-bold tnum">Accuracy</th>
                      <th className="pb-2 font-bold">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SELF_CHECK_SKILLS.map(skill => {
                      const rating = record.ratings[skill];
                      const unitObj = units.find(u => u.id === record.unit);
                      const pct = unitObj
                        ? computeSkillAccuracy(unitObj, record.level, progress)[skill].pct
                        : 0;
                      const flag = selfCheckFlag(rating, pct);
                      return (
                        <tr key={skill} className="border-t border-slate-200">
                          <td className="py-2 pr-2 font-semibold text-ink">{SKILL_LABELS[skill]}</td>
                          <td className="py-2 pr-2">{rating ? <RatingDots rating={rating} /> : <span className="text-muted">—</span>}</td>
                          <td className="py-2 pr-2 tnum text-ink">{pct}%</td>
                          <td className="py-2">
                            {flag === 'high' && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">high</span>}
                            {flag === 'low' && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">low</span>}
                            {flag === '' && <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-sm text-muted">
                  Hardest today: <span className="font-semibold text-ink">{record.hardest ? SKILL_LABELS[record.hardest] : '—'}</span>
                  {record.note && (
                    <>
                      {' '}· Note: <span className="italic text-ink">“{record.note}”</span>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
