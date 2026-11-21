import { useEffect, useMemo, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { SKILLS, bandFor, type TeacherDataset } from '../../lib/teacherOverview';
import { mergedRows } from '../../lib/pacingExport';

/**
 * PHASE 12 — the front page (Part B): three numbers, three sentences, no
 * charts. Each card opens its tab filtered to exactly the learners it
 * counted — both the cards and the tabs read the same dataset function.
 */
export function ClassOverview({
  dataset, onOpenTab, timingNewerThanLastVisit,
}: {
  dataset: TeacherDataset;
  onOpenTab: (tab: 'pacing' | 'selfcheck' | 'capstone', learnerFilter: string[] | null) => void;
  timingNewerThanLastVisit: number;
}) {
  const o = dataset.overview;
  // The actionable answer behind the coverage card: the learners missing the
  // oldest unit — one click from the card to exactly those learners.
  const missingOldestLearners = o.coverageOldestUnit === null
    ? null
    : dataset.coverage.filter(c => o.coverageOldestUnit !== null && !c.units.has(o.coverageOldestUnit)).map(c => c.learner);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => onOpenTab('selfcheck', missingOldestLearners)}
          className="surface-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
          style={{ minHeight: 132 }}
          aria-label={`Coverage: ${o.coverageDone} of ${o.coverageTotal} learners have finished Unit 5. Opens the Self-check tab filtered to the learners missing Unit ${o.coverageOldestUnit}.`}
        >
          <p className="eyebrow mb-1">Coverage</p>
          <p className="tnum font-heading text-2xl font-extrabold text-ink">
            {o.coverageDone} of {o.coverageTotal}
          </p>
          <p className="mt-0.5 text-sm text-muted">learners have finished Unit 5</p>
          {o.coverageOldestUnit !== null && (
            <p className="mt-2 text-xs font-semibold text-muted">
              Oldest: Unit {o.coverageOldestUnit} ({o.coverageOldestMissing} learner{o.coverageOldestMissing === 1 ? '' : 's'})
            </p>
          )}
        </button>

        <button
          onClick={() => onOpenTab('selfcheck', null)}
          className="surface-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
          style={{ minHeight: 132 }}
          aria-label={`Self-check: ${o.overconfident} overconfident, ${o.underconfident} underconfident. Opens the Self-check tab.`}
        >
          <p className="eyebrow mb-1">Self-check</p>
          <p className="tnum font-heading text-2xl font-extrabold text-ink">
            {o.overconfident + o.underconfident} learner{o.overconfident + o.underconfident === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 text-sm text-muted">misjudge themselves</p>
          <p className="mt-2 text-xs font-semibold text-muted">
            {o.overconfident} overconfident · {o.underconfident} underconfident
          </p>
        </button>

        <button
          onClick={() => onOpenTab('capstone', null)}
          className="surface-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
          style={{ minHeight: 132 }}
          aria-label={`${o.pendingCount} certificates waiting to be released. Opens the Capstone tab.`}
        >
          <p className="eyebrow mb-1">Waiting for you</p>
          <p className="tnum font-heading text-2xl font-extrabold text-ink">
            {o.pendingCount} certificate{o.pendingCount === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 text-sm text-muted">waiting to be released</p>
          {o.pendingOldestDays !== null && o.pendingOldestDays > 0 && (
            <p className="mt-2 text-xs font-semibold text-muted">Oldest: {o.pendingOldestDays} day{o.pendingOldestDays === 1 ? '' : 's'}</p>
          )}
        </button>
      </div>

      {/* The generated sentence — data-driven, omitted when nobody qualifies */}
      {o.misjudgeSentence && (
        <p className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-ink">
          {o.misjudgeSentence}
        </p>
      )}

      {/* The quiet line — timing data newer than the last Teacher Mode visit */}
      {timingNewerThanLastVisit > 0 && (
        <p className="text-xs font-semibold text-muted">
          {timingNewerThanLastVisit} lesson{timingNewerThanLastVisit === 1 ? ' was' : 's were'} timed this week.
          Open Pacing before you plan next week.
        </p>
      )}
    </div>
  );
}

/**
 * PHASE 12 — the learner card (Part F): one drawer with everything about one
 * learner, opening over whichever tab is active. A4 portrait when printed.
 */
export function LearnerCard({
  dataset, learner, localLearner, localProgress, onClose,
}: {
  dataset: TeacherDataset;
  learner: string;
  localLearner: string;
  localProgress: import('../../types').ProgressData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const resolved = dataset.resolve(learner);
  const rosterEntry = dataset.roster.find(r => r.id === dataset.resolve(learner).displayName) ?? dataset.roster.find(r => r.name === learner);

  const selfck = dataset.selfck.filter(r => r.learner === learner);
  const attempt = dataset.attempts.find(a => a.learner === learner);
  const pacing = useMemo(() => mergedRows(localProgress, learner).filter(r => r.learner === learner), [localProgress, learner]);
  const medianByLevel = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const r of pacing) {
      const arr = m.get(r.level) ?? [];
      arr.push(r.totalMinutes);
      m.set(r.level, arr);
    }
    return [...m.entries()].map(([level, xs]) => {
      const sorted = [...xs].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const med = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      return { level, median: Math.round(med * 10) / 10, label: med };
    });
  }, [pacing]);
  const notes = selfck.filter(r => r.note).sort((a, b) => a.completedAt - b.completedAt);
  const rawPct = (p: number) => `${Math.round(p)}%`;

  const printCard = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Learner card: ${resolved.displayName}`}
        className="learner-card max-h-[88vh] w-full max-w-[680px] overflow-y-auto rounded-card bg-white p-5 shadow-card sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-ink">{resolved.displayName}</h2>
            <p className="text-xs text-muted">
              {rosterEntry?.class ? `Class ${rosterEntry.class} · ` : ''}
              {resolved.matched
                ? 'matched to the roster'
                : 'NOT matched to the roster — the raw name is used everywhere'}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={printCard} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-slate-100" aria-label="Print learner card">
              <Printer size={16} aria-hidden />
            </button>
            <button onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-slate-100" aria-label="Close learner card">
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Coverage 9x3 */}
        <p className="eyebrow mb-2">Coverage — units finished</p>
        {(() => {
          const cov = dataset.coverage.find(c => c.learner === learner);
          const done: Set<number> = cov?.units ?? new Set();
          const selfckUnits = new Set(selfck.filter(r => !r.skipped).map(r => r.unit));
          return (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full min-w-[340px] text-center text-[10px]">
                <thead>
                  <tr className="text-muted">
                    <th className="w-16 text-left font-bold">Level</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(u => <th key={u} className="pb-1 font-bold tnum">U{u}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(['easy', 'core', 'challenging'] as const).map(level => (
                    <tr key={level}>
                      <td className="py-0.5 text-left font-semibold text-muted">{level.slice(0, 4)}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(u => {
                        const localDone = learner === localLearner && (
                          localProgress.units?.[u]?.[level]?.completed === true ||
                          localProgress.units?.[u]?.[level]?.stations?.boss?.completed === true
                        );
                        const has = done.has(u) || (selfckUnits.has(u) && level === 'core') || localDone;
                        return (
                          <td key={u} className="py-0.5">
                            <span
                              className={`inline-block h-4 w-6 rounded ${has ? 'bg-brand/80' : 'bg-slate-100'}`}
                              title={`${level} · Unit ${u}: ${has ? 'finished' : 'no record'}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Pacing */}
        <p className="eyebrow mb-2">Pacing — median minutes per level</p>
        {medianByLevel.length > 0 ? (
          <div className="mb-4 space-y-1">
            {medianByLevel.map(m => {
              const label = { easy: 45, core: 51, challenging: 53 }[m.level] ?? null;
              return (
                <p key={m.level} className="text-xs text-ink">
                  <span className="font-semibold text-muted capitalize">{m.level}: </span>
                  <span className="tnum font-bold">{m.median.toFixed(1)} min</span>
                  {label !== null && <span className="text-muted"> (label {label})</span>}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted">No lesson timings recorded on this device.</p>
        )}

        {/* Self-check */}
        <p className="eyebrow mb-2">Self-check — latest ratings beside bands</p>
        {selfck.length > 0 ? (
          <div className="mb-4 space-y-2">
            {selfck.slice(0, 3).map(r => (
              <div key={`${r.unit}-${r.level}-${r.completedAt}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-ink">Unit {r.unit} · {r.level}</p>
                <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {SKILLS.map(skill => {
                    const rating = r.ratings[skill];
                    const pct = r.accuracy[skill] ?? 0;
                    const flag = r.flags[skill];
                    return (
                      <p key={skill} className="text-[11px] text-ink">
                        <span className="font-semibold text-muted capitalize">{skill.slice(0, 4)}: </span>
                        {rating ? `${['Not yet', 'Almost', 'Yes'][rating - 1]} · ${bandFor(pct)}` : '—'}
                        {flag && <span className={`ml-1 font-extrabold ${flag === 'high' ? 'text-amber-600' : 'text-mint'}`}>{flag}</span>}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
            {(() => {
              const flagCount = Object.values(Object.fromEntries(selfck.flatMap(r => Object.entries(r.flags)))).length;
              return flagCount > 0 ? <p className="text-[11px] font-semibold text-muted">{flagCount} flag{flagCount === 1 ? '' : 's'} across all records.</p> : null;
            })()}
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted">No self-check records.</p>
        )}

        {/* Capstone */}
        <p className="eyebrow mb-2">Capstone</p>
        {attempt ? (
          <p className="mb-4 text-xs text-ink">
            {attempt.outcome === 'issued' && <>Issued{attempt.certificateId ? ` · ${attempt.certificateId}` : ''}{attempt.releasedBy ? ` by ${attempt.releasedBy}` : ''}</>}
            {attempt.outcome === 'pending' && <>Pending{attempt.overall !== null ? ` · ${Math.round(attempt.overall)}% overall` : ''}</>}
            {attempt.outcome === 'not_issued' && <>Not issued{attempt.overall !== null ? ` · ${Math.round(attempt.overall)}% overall` : ''}</>}
            {attempt.outcome === null && <>Attempted, not finished</>}
            {attempt.retakeNote && <span className="mt-1 block font-semibold text-amber-700">Teacher's note: “{attempt.retakeNote}”</span>}
          </p>
        ) : (
          <p className="mb-4 text-xs text-muted">Not attempted.</p>
        )}

        {/* Notes */}
        <p className="eyebrow mb-2">Her notes, in order</p>
        {notes.length > 0 ? (
          <div className="space-y-1.5">
            {notes.map((n, i) => (
              <p key={i} className="text-xs leading-5 text-ink">
                <span className="font-semibold text-muted">U{n.unit} ({n.level}): </span>“{n.note}”
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">None.</p>
        )}
        {(() => {
          void rawPct;
          return null;
        })()}
      </div>
    </div>
  );
}
