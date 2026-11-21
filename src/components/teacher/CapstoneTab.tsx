import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { SKILLS, bandFor, type MergedAttempt, type TeacherDataset } from '../../lib/teacherOverview';
import { mergeCapstoneAttempts } from '../../lib/teacherMerge';

const LEVEL_LABELS: Record<string, string> = { easy: 'Easy', core: 'Core', challenging: 'Challenging' };
const SKILL_LABELS: Record<string, string> = {
  vocabulary: 'Vocab', grammar: 'Grammar', listening: 'Listen', reading: 'Read',
  writing: 'Write', speaking: 'Speak',
};

const csvCell = (v: string | number | undefined | null): string => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function rowsToCsv(rows: MergedAttempt[]): string {
  const header = 'learner,unit,level,date,vocabulary_pct,grammar_pct,listening_pct,reading_pct,writing_pct,speaking_pct,overall,outcome,certificateId,releasedBy,finishedAtISO';
  const lines: string[] = [header];
  for (const r of rows) {
    lines.push([
      csvCell(r.learner),
      '', // unit: the capstone spans all nine — the fixture's per-attempt rows carry none
      '', // level
      r.finishedAt ? new Date(r.finishedAt).toISOString().slice(0, 10) : '',
      r.skillScores?.vocabulary ?? '',
      r.skillScores?.grammar ?? '',
      r.skillScores?.listening ?? '',
      r.skillScores?.reading ?? '',
      r.skillScores?.writing ?? '',
      r.skillScores?.speaking ?? '',
      r.overall ?? '',
      r.outcome ?? '',
      csvCell(r.certificateId ?? ''),
      csvCell(r.releasedBy ?? ''),
      r.finishedAt ? new Date(r.finishedAt).toISOString() : '',
    ].join(','));
  }
  return lines.join('\n');
}

const weakestTwo = (scores: Partial<Record<string, number>> | null): string[] => {
  if (!scores) return [];
  return SKILLS
    .map(s => ({ s, v: scores[s] ?? 0 }))
    .sort((a, b) => a.v - b.v)
    .slice(0, 2)
    .map(x => SKILL_LABELS[x.s]);
};

const TONE: Record<string, string> = {
  issued: 'border-emerald-200 bg-emerald-50',
  pending: 'border-amber-200 bg-amber-50',
  not_issued: 'border-slate-200 bg-slate-50',
};
const TONE_LABEL: Record<string, string> = { issued: 'Issued', pending: 'Pending', not_issued: 'Not issued' };

/**
 * PHASE 12 — Capstone tab (Part E3). Order: pending → issued → not issued,
 * most recent first inside each. THE HARD RULE stands: release actions exist
 * only for an unlocked teacher session with a recorded name — no self-service
 * bypass, ever.
 */
export function CapstoneTab({
  dataset, teacherName, onRelease, onReturn, onChanged, onOpenLearner, learnerFilter,
}: {
  dataset: TeacherDataset;
  teacherName: string;
  onOpenLearner?: (name: string) => void;
  learnerFilter?: string[] | null;
  onRelease: (learner: string, attempt: MergedAttempt) => Promise<void>;
  onReturn: (learner: string, note: string) => void;
  onChanged: () => void;
}) {
  const scoped = learnerFilter && learnerFilter.length > 0
    ? dataset.attempts.filter(a => learnerFilter.includes(a.learner) || learnerFilter.includes(a.displayName))
    : dataset.attempts;
  const pending = scoped.filter(a => a.outcome === 'pending');
  const issued = scoped.filter(a => a.outcome === 'issued');
  const notIssued = scoped.filter(a => a.outcome === 'not_issued');

  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // BULK: release everything above 65% — the 50% skill floor STILL applies
  // per learner. Report released AND skipped, with reasons (Part E3).
  const bulkRelease = async () => {
    let released = 0;
    const skipped: string[] = [];
    for (const attempt of pending) {
      const overall = attempt.overall ?? 0;
      const floorOk = SKILLS.every(s => (attempt.skillScores?.[s] ?? 0) >= 50);
      if (overall > 65 && floorOk) {
        await onRelease(attempt.learner, attempt);
        released++;
      } else if (!floorOk) {
        const worst = weakestTwo(attempt.skillScores)[0] ?? 'a skill';
        skipped.push(`${attempt.displayName} (${Math.round(overall)}% overall but ${SKILL_LABELS[weakestTwo(attempt.skillScores)[0] ?? 'speaking']?.toLowerCase() ?? 'a skill'} under 50)`);
        void worst;
      } else {
        skipped.push(`${attempt.displayName} (${Math.round(overall)}% — not above 65)`);
      }
    }
    const skipLine = skipped.length > 0 ? ` Skipped: ${skipped.join('; ')}.` : '';
    setBulkMsg(`Released ${released} certificate${released === 1 ? '' : 's'}.${skipLine}`);
    onChanged();
  };

  const exportCsv = () => {
    const blob = new Blob([rowsToCsv(dataset.attempts)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangout2-capstone-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Row = ({ attempt }: { attempt: MergedAttempt }) => {
    const [localExpanded, setLocalExpanded] = useState(false);
    const open = expanded === attempt.id || localExpanded;
    const scores = attempt.skillScores;
    return (
      <div className={`rounded-xl border p-4 ${TONE[attempt.outcome ?? 'not_issued']}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">
              {onOpenLearner ? (<button onClick={() => onOpenLearner(attempt.learner)} className="underline decoration-dotted">{attempt.displayName}</button>) : attempt.displayName}
              {attempt.source !== 'local' && (
                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{attempt.source}</span>
              )}
            </p>
            <p className="text-xs text-muted">
              {TONE_LABEL[attempt.outcome ?? 'not_issued']}
              {attempt.outcome === 'issued' && attempt.releasedBy ? ` by ${attempt.releasedBy}` : ''}
              {attempt.certificateId ? ` · ${attempt.certificateId}` : ''}
              {attempt.finishedAt ? ` · ${new Date(attempt.finishedAt).toLocaleDateString()}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {attempt.outcome === 'issued' && (
              <button
                onClick={() => { window.location.hash = `#/capstone/certificate`; setLocalExpanded(v => !v); }}
                className="action-secondary text-sm"
                style={{ minHeight: 44 }}
              >
                View certificate
              </button>
            )}
            {attempt.outcome === 'not_issued' && scores && (
              <button
                onClick={() => {
                  const [w1, w2] = weakestTwo(scores);
                  const note = `Your strongest growth areas right now are ${w1 ?? 'listening'} and ${w2 ?? 'reading'}. Take the Final Gate again when you are ready — it is always open.`;
                  void navigator.clipboard.writeText(note).catch(() => {});
                  setLocalExpanded(true);
                }}
                className="action-secondary text-sm"
                style={{ minHeight: 44 }}
              >
                Copy retake note
              </button>
            )}
            {scores && (
              <button
                onClick={() => setLocalExpanded(v => !v)}
                className="text-xs font-bold text-brand underline"
                style={{ minHeight: 44 }}
                aria-expanded={open}
              >
                {open ? 'Hide profile' : 'Skill profile'}
              </button>
            )}
          </div>
        </div>

        {/* Row expansion (Part E3): bands + island station scores + seals */}
        {open && scores && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SKILLS.map(s => (
                <p key={s} className="text-xs text-ink">
                  <span className="font-semibold text-muted">{SKILL_LABELS[s]}: </span>
                  {bandFor(scores[s] ?? 0)}
                  <span className="ml-1 text-[10px] text-muted tnum">{scores[s] ?? 0}%</span>
                </p>
              ))}
              <p className="col-span-2 text-xs font-bold text-ink sm:col-span-3">
                Overall: {attempt.overall ?? 0}%
              </p>
            </div>
            {Object.keys(attempt.seals ?? {}).length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Seals: {Object.entries(attempt.seals).map(([id, s]) => `${id} ${s.correct}/${s.total}`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 teacher-print-view">
      <p className="print-caption text-xs font-semibold text-muted print:block hidden">
        Capstone outcomes — Hangout 2 English Quest
      </p>

      {/* PENDING first (Part E3) */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-extrabold text-ink">
            Waiting for you <span className="ml-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-extrabold text-amber-700">{pending.length}</span>
          </h3>
          {pending.length > 0 && (
            <button onClick={bulkRelease} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Release all above 65%
            </button>
          )}
        </div>
        <p className="mb-4 text-xs leading-5 text-muted">
          Overall 50–69%, or any skill under 50%. Only you can release — no self-service bypass.
          The bulk action still applies the 50% skill floor and reports every skip.
        </p>
        {bulkMsg && <p className="mb-3 rounded-xl border border-brand/30 bg-teal-50/60 p-3 text-xs leading-5 text-ink">{bulkMsg}</p>}
        {pending.length === 0 ? (
          <p className="text-sm text-muted">No results are waiting.</p>
        ) : (
          <div className="space-y-3">
            {pending.map(a => (
              <PendingRow key={a.id} attempt={a} teacherName={teacherName} onRelease={onRelease} onReturn={onReturn} onChanged={onChanged} noteFor={noteFor} setNoteFor={setNoteFor} noteText={noteText} setNoteText={setNoteText} />
            ))}
          </div>
        )}
      </div>

      {/* Issued + not issued */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-extrabold text-ink">All outcomes</h3>
          <div className="flex gap-2 print:hidden">
            <button onClick={exportCsv} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => window.print()} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              <Printer size={15} /> Print this view
            </button>
          </div>
        </div>
        {issued.length === 0 && notIssued.length === 0 ? (
          <p className="text-sm text-muted">No issued or returned attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {[...issued, ...notIssued].map(a => <Row key={a.id} attempt={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingRow({
  attempt, teacherName, onRelease, onReturn, noteFor, setNoteFor, noteText, setNoteText,
}: {
  attempt: MergedAttempt;
  teacherName: string;
  onRelease: (learner: string, attempt: MergedAttempt) => Promise<void>;
  onReturn: (learner: string, note: string) => void;
  onChanged: () => void;
  noteFor: string | null;
  setNoteFor: (v: string | null) => void;
  noteText: string;
  setNoteText: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scores = attempt.skillScores;
  return (
    <div className={`rounded-xl border p-4 ${TONE.pending}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{attempt.displayName}</p>
          <p className="text-xs text-muted">
            Pending{attempt.overall !== null ? ` · ${Math.round(attempt.overall)}% overall` : ''}
            {attempt.finishedAt ? ` · ${new Date(attempt.finishedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={async () => { setBusy(true); await onRelease(attempt.learner, attempt); setBusy(false); }}
            disabled={busy || teacherName === ''}
            title={teacherName === '' ? 'Set your name in Release details above' : undefined}
            className="action-primary text-sm"
            style={{ minHeight: 44 }}
          >
            Release certificate
          </button>
          <button onClick={() => setNoteFor(attempt.id)} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            Return for retake
          </button>
          {scores && (
            <button onClick={() => setExpanded(v => !v)} className="text-xs font-bold text-brand underline" style={{ minHeight: 44 }} aria-expanded={expanded}>
              {expanded ? 'Hide profile' : 'Skill profile'}
            </button>
          )}
        </div>
      </div>
      {expanded && scores && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SKILLS.map(s => (
              <p key={s} className="text-xs text-ink">
                <span className="font-semibold text-muted">{SKILL_LABELS[s]}: </span>
                {bandFor(scores[s] ?? 0)}
                <span className="ml-1 text-[10px] text-muted tnum">{scores[s] ?? 0}%</span>
              </p>
            ))}
            <p className="col-span-2 text-xs font-bold text-ink sm:col-span-3">Overall: {attempt.overall ?? 0}%</p>
          </div>
        </div>
      )}
      {noteFor === attempt.id && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 print:hidden">
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor={`note-${attempt.id}`}>
            Short note for the learner (shown on her next visit)
          </label>
          <input
            id={`note-${attempt.id}`}
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="e.g. Recheck the seasons words, then try again"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
            style={{ minHeight: 44 }}
          />
          <button
            onClick={() => { onReturn(attempt.learner, noteText); setNoteFor(null); setNoteText(''); }}
            className="action-primary mt-2 text-sm"
            style={{ minHeight: 44 }}
          >
            Return for retake
          </button>
          {teacherName === '' && (
            <p className="mt-2 text-xs font-semibold text-coral">
              Set your name in the release details first — a release without a name is worse than a pending one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
