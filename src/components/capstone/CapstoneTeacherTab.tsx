import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  allLearnerAttempts, capstoneCsv, releaseAttempt, returnAttempt, CAPSTONE_WEIGHTS, SKILLS,
} from '../../lib/capstone';
import { capstoneSkillLabels } from '../../data/capstone';
import type { CapstoneAttempt, CapstoneOutcome } from '../../types';

/**
 * Part J — the Capstone tab. Every learner's outcome, colour-coded by the
 * three states (not by score). The PENDING queue sits at the top, most
 * recent first, with three actions per row. The teacher's release is the
 * ONLY path from pending to issued — there is no self-service bypass, no
 * URL parameter, and no settings toggle that turns it off.
 */
export function CapstoneTab({
  schoolName, onSchoolName,
}: {
  schoolName: string;
  onSchoolName: (v: string) => void;
}) {
  const [teacherName, setTeacherName] = useState('');
  const [csv, setCsv] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Read fresh every render: a release must move the row out of the pending
  // queue the moment it happens, so the attempt list is never memoized.
  void refreshKey;
  const rows = allLearnerAttempts();

  const pending = rows
    .filter(r => r.attempt.outcome === 'pending')
    .sort((a, b) => b.attempt.finishedAt - a.attempt.finishedAt);
  const decided = rows.filter(r => r.attempt.outcome !== 'pending');

  const release = async (learner: string) => {
    await releaseAttempt(learner, teacherName);
    setRefreshKey(k => k + 1);
  };

  const doReturn = async (learner: string, note: string) => {
    returnAttempt(learner, note);
    setNoteFor(null);
    setNoteText('');
    setRefreshKey(k => k + 1);
  };

  // Bulk release, most recent first — the 50% skill floor still applies.
  const releaseAllAbove65 = async () => {
    let released = 0;
    for (const { learner, attempt } of pending) {
      const overall = attempt.overall ?? 0;
      const floorOk = SKILLS.every(s => (attempt.skillScores?.[s] ?? 0) >= 50);
      if (overall > 65 && floorOk) {
        await releaseAttempt(learner, teacherName);
        released++;
      }
    }
    setBulkMsg(`Released ${released} certificate${released === 1 ? '' : 's'}.`);
    setRefreshKey(k => k + 1);
  };

  const downloadCsv = () => {
    const content = capstoneCsv(allLearnerAttempts());
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capstone-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      {/* Teacher name + school name for certificates */}
      <div className="surface-card p-5 sm:p-6">
        <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Release details</h3>
        <p className="mb-3 text-xs leading-5 text-muted">
          Your name is recorded on every certificate you release. The school name prints at the
          top of each one.
        </p>
        <label className="mb-1 block text-xs font-bold text-ink" htmlFor="teacher-name">Your name</label>
        <input
          id="teacher-name"
          type="text"
          value={teacherName}
          onChange={e => setTeacherName(e.target.value)}
          placeholder="Teacher name"
          className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          style={{ minHeight: 44 }}
        />
        <label className="mb-1 block text-xs font-bold text-ink" htmlFor="school-name">School name</label>
        <input
          id="school-name"
          type="text"
          value={schoolName}
          onChange={e => onSchoolName(e.target.value)}
          placeholder="Hangout 2 — English Quest"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          style={{ minHeight: 44 }}
        />
      </div>

      {/* PENDING queue */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-extrabold text-ink">
            Waiting for you <span className="ml-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-extrabold text-amber-700">{pending.length}</span>
          </h3>
          {pending.length > 0 && (
            <button onClick={releaseAllAbove65} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Release all above 65%
            </button>
          )}
        </div>
        <p className="mb-4 text-xs leading-5 text-muted">
          Overall 50–69%, or any single skill under 50%. Only you can release these — the bulk
          action still applies the 50% skill floor.
        </p>
        {bulkMsg && <p className="mb-3 text-sm font-semibold text-mint">{bulkMsg}</p>}
        {pending.length === 0 ? (
          <p className="text-sm text-muted">No results are waiting.</p>
        ) : (
          <div className="space-y-3">
            {pending.map(({ learner, attempt }) => (
              <AttemptRow
                key={`${learner}-${attempt.id}-${refreshKey}`}
                learner={learner}
                attempt={attempt}
                tone="pending"
                onRelease={() => release(learner)}
                onReturn={() => setNoteFor(attempt.id)}
                noteFor={noteFor === attempt.id}
                noteText={noteText}
                setNoteText={setNoteText}
                onReturnConfirm={() => doReturn(learner, noteText)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decided attempts */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-extrabold text-ink">All results</h3>
          <button onClick={downloadCsv} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
        {decided.length === 0 ? (
          <p className="text-sm text-muted">No issued or returned attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {decided.map(({ learner, attempt }) => (
              <AttemptRow key={`${learner}-${attempt.id}`} learner={learner} attempt={attempt} tone={attempt.outcome as CapstoneOutcome} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TONE: Record<CapstoneOutcome, string> = {
  issued: 'border-emerald-200 bg-emerald-50',
  pending: 'border-amber-200 bg-amber-50',
  not_issued: 'border-slate-200 bg-slate-50',
};

const TONE_LABEL: Record<CapstoneOutcome, string> = {
  issued: 'Issued',
  pending: 'Pending',
  not_issued: 'Not issued',
};

function AttemptRow({
  learner, attempt, tone, onRelease, onReturn, noteFor, noteText, setNoteText, onReturnConfirm,
}: {
  learner: string;
  attempt: CapstoneAttempt;
  tone: CapstoneOutcome;
  onRelease?: () => void;
  onReturn?: () => void;
  noteFor?: boolean;
  noteText?: string;
  setNoteText?: (v: string) => void;
  onReturnConfirm?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const scores = attempt.skillScores;
  return (
    <div className={`rounded-xl border p-4 ${TONE[tone]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{learner}</p>
          <p className="text-xs text-muted">
            {TONE_LABEL[tone]}
            {attempt.outcome === 'issued' && attempt.releasedBy ? ` by ${attempt.releasedBy}` : ''}
            {attempt.certificateId ? ` · ${attempt.certificateId}` : ''}
            {attempt.finishedAt ? ` · ${new Date(attempt.finishedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tone === 'pending' && onRelease && (
            <button onClick={onRelease} className="action-primary text-sm" style={{ minHeight: 44 }}>
              Release certificate
            </button>
          )}
          {tone === 'pending' && onReturn && (
            <button onClick={onReturn} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Return for retake
            </button>
          )}
          {scores && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs font-bold text-brand underline"
              style={{ minHeight: 44 }}
              aria-expanded={expanded}
            >
              {expanded ? 'Hide profile' : 'Skill profile'}
            </button>
          )}
        </div>
      </div>
      {expanded && scores && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SKILLS.map(s => (
            <p key={s} className="text-xs text-ink">
              <span className="font-semibold text-muted">{capstoneSkillLabels[s]}: </span>
              {scores[s] ?? 0}%
            </p>
          ))}
          <p className="col-span-2 text-xs font-bold text-ink sm:col-span-3">
            Overall: {attempt.overall ?? 0}%
          </p>
        </div>
      )}
      {noteFor && setNoteText && onReturnConfirm && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor={`note-${attempt.id}`}>
            Short note for the learner (shown on their next visit)
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
          <button onClick={onReturnConfirm} className="action-primary mt-2 text-sm" style={{ minHeight: 44 }}>
            Return for retake
          </button>
        </div>
      )}
    </div>
  );
}
