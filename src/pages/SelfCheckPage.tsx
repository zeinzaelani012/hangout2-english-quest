import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnitSelfAssessment } from '../data/units';
import { AudioButton } from '../components/AudioButton';
import { SKILL_COLORS, type Level, type SelfRating, type Skill } from '../types';

// Fixed skill order — seeing the whole shape of the lesson is part of the value.
const SKILL_ORDER: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];
const SKILL_LABELS: Record<Skill, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};
const RATINGS: { value: SelfRating; label: string }[] = [
  { value: 1, label: 'Not yet' },
  { value: 2, label: 'Almost' },
  { value: 3, label: 'Yes' },
];

/**
 * PHASE 7 — SELF-ASSESSMENT. Runs after the BOSS, before the results screen:
 * the learner rates themselves before seeing their score, so the rating is a
 * prediction. One screen, three blocks, under 90 seconds. Skippable in one
 * tap; skipping is never punished and never mentioned again.
 */
export function SelfCheckPage() {
  const { unitId, level } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSelfAssessment } = useProgress();
  const unitNum = parseInt(unitId || '0');
  const levelKey = (level || 'core') as Level;
  const selfAssessment = getUnitSelfAssessment(unitNum);
  // The results payload from the completed BOSS station is forwarded to the
  // results screen after this one.
  const incoming = (location.state ?? {}) as Record<string, unknown>;
  const [ratings, setRatings] = useState<Partial<Record<Skill, SelfRating>>>({});
  const [hardest, setHardest] = useState<Skill | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const allRated = SKILL_ORDER.every(s => ratings[s] !== undefined);
  const canSubmit = allRated && hardest !== null;

  const finish = (skipped: boolean) => {
    if (saved) return;
    setSaved(true);
    saveSelfAssessment({
      unit: unitNum,
      level: levelKey,
      ratings: skipped ? {} : ratings,
      hardest: skipped ? null : hardest,
      note: !skipped && note.trim() ? note.trim() : undefined,
      completedAt: Date.now(),
      skipped,
    });
    navigate('/results', { state: { ...incoming, selfChecked: !skipped } });
  };

  const selectRating = (skill: Skill, value: SelfRating) => {
    setRatings(prev => ({ ...prev, [skill]: value }));
  };

  // Arrow keys move within a row's three options (Enter selects, native button).
  const rowKeyDown = (skill: Skill, e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const current = ratings[skill] ?? 0;
    const next = e.key === 'ArrowRight' ? Math.min(3, current + 1) : Math.max(1, current - 1);
    if (next === current) return;
    selectRating(skill, next as SelfRating);
    const buttons = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button[data-rating]');
    buttons[next - 1]?.focus();
  };

  const intro = selfAssessment?.intro ?? 'There are no right answers here. Be honest — it helps you.';
  const hardestPrompt = selfAssessment?.hardestPrompt ?? 'Which one was hardest today?';
  const notePrompt = selfAssessment?.notePrompt ?? 'One thing I want to get better at.';
  // Units without a selfAssessment block fall back to a neutral generic
  // statement per skill — the screen and comparison still work.
  const statement = (skill: Skill) =>
    selfAssessment?.skills?.[skill]?.[levelKey] ?? `I can handle the ${SKILL_LABELS[skill].toLowerCase()} tasks from this unit.`;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <button onClick={() => finish(true)} className="inline-flex items-center gap-1.5 font-semibold hover:text-brand">
          <ArrowLeft size={14} /> Back
        </button>
      </nav>

      <section className="surface-card mb-6 p-5 sm:p-8">
        <p className="eyebrow mb-1">Unit {unitNum} · {levelKey ? levelKey.charAt(0).toUpperCase() + levelKey.slice(1) : ''}</p>
        <h1 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">How did I do?</h1>
        <p className="mt-2 text-sm text-muted">{intro}</p>
      </section>

      <section aria-label="Can-do check" className="mb-6">
        <h2 className="sr-only">Can-do check</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {SKILL_ORDER.map(skill => {
            const color = SKILL_COLORS[skill];
            const value = ratings[skill];
            return (
              <li key={skill}>
                <div
                  className="surface-card h-full p-4"
                  role="radiogroup"
                  aria-label={`${SKILL_LABELS[skill]}: ${statement(skill)}`}
                  onKeyDown={e => rowKeyDown(skill, e)}
                >
                  <div className="mb-2 flex items-start gap-2.5">
                    <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                    <p className="flex-1 text-sm font-semibold leading-6 text-ink [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
                      {statement(skill)}
                    </p>
                    <AudioButton
                      audioKey={`selfcheck-u${unitNum}-${levelKey}-${skill}`}
                      fallbackText={statement(skill)}
                      className="shrink-0"
                    />
                  </div>
                  <div className="flex gap-2" role="group">
                    {RATINGS.map(r => {
                      const selected = value === r.value;
                      return (
                        <button
                          key={r.value}
                          data-rating={r.value}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => selectRating(skill, r.value)}
                          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition-all sm:text-sm ${
                            selected
                              ? 'border-brand bg-teal-50 text-brand ring-2 ring-brand/20'
                              : 'border-slate-200 bg-white text-muted hover:border-brand/40 hover:text-ink'
                          }`}
                          aria-label={`${r.label}`}
                        >
                          {selected && <Check size={14} aria-hidden />}
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                  <span aria-live="polite" className="sr-only">
                    {SKILL_LABELS[skill]}{value ? ` rated ${RATINGS.find(r => r.value === value)?.label}` : ''}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="surface-card mb-6 p-5" aria-label="Hardest skill">
        <h2 className="mb-3 text-sm font-extrabold text-ink">{hardestPrompt}</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label={hardestPrompt}>
          {SKILL_ORDER.map(skill => {
            const selected = hardest === skill;
            return (
              <button
                key={skill}
                onClick={() => setHardest(skill)}
                aria-pressed={selected}
                className={`min-h-[44px] rounded-pill border px-4 py-2 text-sm font-bold transition-all ${
                  selected
                    ? 'border-coral bg-coral/10 text-coral'
                    : 'border-slate-200 bg-white text-muted hover:border-coral/40 hover:text-ink'
                }`}
              >
                {SKILL_LABELS[skill]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card mb-6 p-5" aria-label="Optional note">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="selfcheck-note" className="text-sm font-extrabold text-ink">
            {notePrompt} <span className="font-medium text-muted">(optional)</span>
          </label>
          <button
            onClick={() => setNote('')}
            className="text-xs font-semibold text-muted underline hover:text-ink"
            aria-label="Clear the note"
          >
            Skip
          </button>
        </div>
        <input
          id="selfcheck-note"
          type="text"
          value={note}
          maxLength={120}
          disabled={saved}
          onChange={e => setNote(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          aria-label={notePrompt}
          placeholder="Write it here, or leave it empty"
        />
        <p className="mt-1 text-xs text-muted tnum">{note.length}/120</p>
      </section>

      <div className="flex items-center justify-between gap-4 pb-4">
        <button
          onClick={() => finish(false)}
          disabled={!canSubmit || saved}
          className="action-primary min-w-[180px] flex-1 sm:flex-none sm:px-10"
          style={{ minHeight: 44 }}
        >
          See my results
        </button>
        <button
          onClick={() => finish(true)}
          disabled={saved}
          className="text-sm text-muted underline hover:text-ink"
        >
          Skip this
        </button>
      </div>
    </div>
  );
}
