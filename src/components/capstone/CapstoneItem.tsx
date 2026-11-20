import { useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import type { CapstoneItem } from '../../data/capstone';
import { adaptCapstoneItem } from '../../data/capstone';
import { GapFill } from '../activities/GapFill';
import { TapToken } from '../activities/TapToken';
import { TapSentence } from '../activities/TapSentence';
import { SentenceBuilder } from '../activities/SentenceBuilder';
import { TypedAnswer } from '../activities/TypedAnswer';
import { RecordAndCompare } from '../activities/RecordAndCompare';
import { AudioButton } from '../AudioButton';
import type { ItemResult } from '../activities/v2-types';

/**
 * Renders ONE capstone item through the course's existing mechanics.
 *
 * Assessment contract (Part C): no teach card, no hint, and — critically —
 * the mechanic UNMOUNTS the instant it reports a result, so the learner
 * never sees "Correct/Review" or an answer mid-station. Explanations live
 * in the station's review step.
 */
export function CapstoneItemBody({
  item,
  passage,
  passageTitle,
  onResult,
}: {
  item: CapstoneItem;
  passage?: string;
  passageTitle?: string;
  onResult: (correct: boolean | null) => void;
}) {
  const [done, setDone] = useState(false);

  const handleResult: ItemResult = (correct) => {
    if (done) return;
    setDone(true);
    onResult(correct);
  };

  if (done) {
    // The parent swaps in its "answer recorded" panel; nothing renders here.
    return null;
  }

  const { activity } = adaptCapstoneItem(item, { level: 'core' });

  // shortResponse has no existing mechanic — the runner renders it itself.
  if (!activity) return null;

  switch (activity.type) {
    case 'errorCorrection':
      return <TapToken activity={activity} onResult={handleResult} />;
    case 'findSentence':
    case 'gist':
    case 'detail':
      return (
        <TapSentence
          activity={activity}
          onResult={handleResult}
          passage={passage ?? item.sentence ?? item.q ?? ''}
          passageTitle={passageTitle}
        />
      );
    case 'sentenceBuilder':
      return <SentenceBuilder activity={activity} onResult={handleResult} />;
    case 'sentenceRepair':
    case 'typeIt':
      return <TypedAnswer activity={activity} onResult={handleResult} />;
    case 'personalResponse':
    case 'monologue':
      return <RecordAndCompare activity={activity} onResult={handleResult} mode={activity.type} />;
    default:
      // pictureToWord / wordToPicture / gapFill / oddOneOut / audioToWord /
      // audioQuestion — one choice item. GapFill derives the Core-level
      // replay allowance (2 plays) from the adapter's difficulty, which is
      // exactly the Part E rail; the soft limit line comes from AudioButton.
      return <GapFill activity={activity} onResult={handleResult} />;
  }
}

/**
 * The runner-owned short writing response (Part E: one sentence build lives
 * in sentenceBuilder items; shortResponse is the three-sentence task). Same
 * honesty pattern as the speaking self-check — never a percentage.
 */
export function ShortResponse({
  item,
  onResult,
}: {
  item: CapstoneItem;
  onResult: (correct: boolean | null) => void;
}) {
  const [text, setText] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(() => (item.checklist ?? []).map(() => false));
  const [done, setDone] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const enough = words >= (item.minimumWords ?? 25);
  const allTicks = ticks.length > 0 && ticks.every(Boolean);

  if (done) return null;

  return (
    <div>
      <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-ink">
        {item.prompt ?? item.q ?? 'Write your answer.'}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write here…"
        rows={5}
        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        style={{ minHeight: 120 }}
        aria-label="Your written answer"
      />
      <p className={`mt-1 text-xs font-semibold ${enough ? 'text-mint' : 'text-muted'}`} aria-live="polite">
        {words} words {enough ? '— long enough' : `(at least ${item.minimumWords ?? 25})`}
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-bold text-ink">Check your writing:</p>
        <div className="space-y-2.5">
          {(item.checklist ?? []).map((line, i) => (
            <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={ticks[i]}
                onChange={e => setTicks(prev => prev.map((t, idx) => (idx === i ? e.target.checked : t)))}
                className="h-5 w-5 rounded border-slate-300 text-brand"
              />
              <span className="text-sm font-semibold text-ink">{line}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (!enough || !allTicks) return;
          setDone(true);
          onResult(true);
        }}
        disabled={!enough || !allTicks}
        className="action-primary mt-4 bg-mint hover:bg-emerald-700"
        style={{ minHeight: 44 }}
      >
        <Check size={18} /> Complete
      </button>
    </div>
  );
}

/** The reading passage, shown above reading items with its Phase 8 control. */
export function CapstonePassage({ passage, title }: { passage: string; title?: string }) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        {title && <p className="eyebrow mb-0">{title}</p>}
        <AudioButton audioKey={`capstone-passage-${title ?? 'x'}`} fallbackText={passage} level="core" />
      </div>
      <p className="text-sm italic leading-6 text-ink">{passage}</p>
    </div>
  );
}

/** Post-answer transcript reveal for listening items (Part E rail). */
export function RecordedPanel({ showWordsScript, onNext, skipped }: { showWordsScript?: string; onNext: () => void; skipped: boolean }) {
  const [showWords, setShowWords] = useState(false);
  return (
    <div className="rounded-xl border border-brand/30 bg-teal-50/50 p-4">
      <p className="text-sm font-bold text-ink">
        {skipped ? 'Moved on without answering — that counts as unanswered.' : 'Answer recorded.'}
      </p>
      {showWordsScript && (
        <div className="mt-3">
          <button
            onClick={() => setShowWords(v => !v)}
            className="action-secondary text-sm"
            style={{ minHeight: 44 }}
            aria-expanded={showWords}
          >
            {showWords ? 'Hide the words' : 'Show the words'}
          </button>
          {showWords && (
            <p className="mt-2 rounded-xl border border-violet/20 bg-violet/5 p-4 text-sm italic leading-6 text-ink">
              <Volume2 size={14} className="mr-1.5 inline text-violet" aria-hidden />
              {showWordsScript}
            </p>
          )}
        </div>
      )}
      <button onClick={onNext} className="action-primary mt-3" style={{ minHeight: 44 }}>
        Next
      </button>
    </div>
  );
}
