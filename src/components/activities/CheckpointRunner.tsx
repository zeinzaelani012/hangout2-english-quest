import { useState, type ReactElement } from 'react';
import type { Activity } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import { GapFill } from './GapFill';
import { TapToken } from './TapToken';
import { TapSentence } from './TapSentence';
import { SentenceBuilder } from './SentenceBuilder';
import { TypedAnswer } from './TypedAnswer';
import { DragSort } from './DragSort';
import { TwoPassAudio } from './TwoPassAudio';
import { RecordAndCompare } from './RecordAndCompare';
import { majorityCorrect, v2Items, type ItemResult } from './v2-types';
import { findPassageContaining } from '../../data/unit1/v2';

interface Props {
  activity: Activity;
  onResult: ItemResult;
  /** D1 reason chip bonus, forwarded to choice mechanics. */
  onBonus?: () => void;
}

const CHOICE_TYPES = new Set([
  'pictureToWord', 'wordToPicture', 'audioToWord', 'audioToPicture',
  'audioQuestion', 'gapFill', 'oddOneOut', 'questionForms', 'transform',
  'preReadVocab', 'notice', 'audioGapFill',
]);

/**
 * PHASE 10 — the runner's dispatch registry. Every embedded item.type the
 * heterogeneous runner handles, exported for scripts/audit-types.mjs: a type
 * that appears in a CP1/BOSS/mixedRecall payload but is missing here FAILS
 * the audit instead of falling through to a choice grid. Kept as a FLAT
 * literal list so the audit can verify it from source. Item order is exactly
 * the pack order; the dispatch below never shuffles.
 */
export const RUNNER_HANDLED_ITEM_TYPES: readonly string[] = [
  // structured mechanics
  'twoPass', 'grouping', 'tapSentence', 'speaking',
  'errorCorrection', 'sentenceBuilder', 'spelling', 'typeIt', 'sentenceRepair',
  // D2-converted items carry no type — rendered as typed answers
  '(none)',
  // choice mechanics (CHOICE_TYPES below)
  'pictureToWord', 'wordToPicture', 'audioToWord', 'audioToPicture',
  'audioQuestion', 'gapFill', 'oddOneOut', 'questionForms', 'transform',
  'preReadVocab', 'notice', 'audioGapFill',
];

/**
 * CHECKPOINT_RUNNER — checkpoint (CP1), boss and mixedRecall. Not a new
 * mechanic: the payload's items render through the mechanics above, one at a
 * time, behind a single progress bar. XP is awarded once at the end.
 * Speaking items render inline in the mixed sequence and record the mark
 * only once a recording (or the no-mic self-check) exists — a skipped
 * speaking item counts as unanswered via majorityCorrect.
 */
export function CheckpointRunner({ activity, onResult, onBonus }: Props) {
  const items = v2Items(activity.payload);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [itemDone, setItemDone] = useState(false);

  const item = items[index];
  const total = items.length;
  const isLast = index >= total - 1;

  const recordItem = (correct: boolean) => {
    setResults(prev => [...prev, correct]);
    setItemDone(true);
  };

  const handleNext = () => {
    if (isLast) {
      onResult(majorityCorrect(results), {
        correctAnswer: 'Checkpoint complete',
        rule: `${results.filter(Boolean).length} of ${total} correct.`,
      });
      return;
    }
    setIndex(i => i + 1);
    setItemDone(false);
  };

  if (!item) return null;

  const kindLabel =
    activity.type === 'boss' ? 'Boss challenge'
    : activity.type === 'mixedRecall' ? 'Mixed recall'
    : 'Checkpoint';

  // Build the sub-activity for this item and dispatch to its mechanic.
  const sub: Activity = {
    ...activity,
    id: `${activity.id}-item-${index}-${item.id ?? 'unnamed'}`,
    prompt: (item.q ?? item.prompt ?? activity.prompt) as string,
  };

  let body: ReactElement;

  if (item.type === 'twoPass') {
    body = <TwoPassAudio activity={{ ...sub, type: 'twoPass', payload: item as any }} onResult={recordItem} />;
  } else if (item.type === 'grouping') {
    body = (
      <DragSort
        activity={{
          ...sub,
          type: 'dragSort',
          payload: {
            bins: item.bins,
            items: (item.words as string[]).map(w => ({ word: w, bin: item.answers[w] })),
          } as any,
        }}
        onResult={recordItem}
      />
    );
  } else if (item.type === 'tapSentence') {
    const passage = findPassageContaining(activity.difficulty, item.answer) ?? '';
    body = (
      <TapSentence
        activity={{ ...sub, type: 'findSentence', payload: { items: [item] } as any }}
        onResult={recordItem}
        passage={passage}
      />
    );
  } else if (item.type === 'speaking') {
    body = (
      <RecordAndCompare
        activity={{
          ...sub,
          type: 'recordAndCompare',
          payload: {
            items: [{ q: item.q, keywords: item.keywords ?? [], minimumSeconds: item.minimumSeconds }],
          } as any,
        }}
        onResult={recordItem}
        mode="askAnswer"
      />
    );
  } else if (item.type === 'errorCorrection') {
    body = <TapToken activity={{ ...sub, type: 'errorCorrection', payload: { items: [item] } as any }} onResult={recordItem} />;
  } else if (item.type === 'sentenceBuilder' || item.type === 'spelling') {
    body = <SentenceBuilder activity={{ ...sub, type: item.type, payload: { items: [item] } as any }} onResult={recordItem} />;
  } else if (item.type === 'typeIt' || item.type === 'sentenceRepair') {
    body = <TypedAnswer activity={{ ...sub, type: item.type, payload: { items: [item] } as any }} onResult={recordItem} />;
  } else if (!item.type && item.answer && !item.options && !item.sentence && !item.tiles && !item.letters) {
    // D2-converted production items carry no type — they are typed answers
    body = <TypedAnswer activity={{ ...sub, type: 'typeIt', payload: { items: [item] } as any }} onResult={recordItem} />;
  } else if (CHOICE_TYPES.has(item.type)) {
    // Forward the slot's whyChoices so the D1 reason chip works inside
    // mixedRecall / checkpoint sequences too.
    const slotWhyChoices = (activity.payload as any)?.whyChoices ?? [];
    body = (
      <GapFill
        activity={{ ...sub, type: item.type, payload: { items: [item], whyChoices: slotWhyChoices } as any }}
        onResult={recordItem}
        onBonus={onBonus}
      />
    );
  } else {
    // PHASE 10 — a missing handler is a build problem, not a learner one:
    // shout in dev (the audit catches it too) and say so plainly.
    if (import.meta.env.DEV) {
      console.error(`[CheckpointRunner] no handler for item type "${item.type}" (unit ${activity.unitId ?? '?'}, item ${item.id ?? index})`);
    }
    body = <p className="text-sm text-muted">This question type is not available in this build.</p>;
  }

  return (
    <div>
      {/* One progress bar for the whole checkpoint */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-muted">{kindLabel} progress</span>
          <span className="tnum text-ink">{index + (itemDone ? 1 : 0)} of {total}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${((index + (itemDone ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Keyed by sub-id so consecutive same-mechanic items start fresh */}
      <div key={`${activity.id}-item-${index}-${item.id ?? 'unnamed'}`}>{body}</div>

      {itemDone && (
        <div className="mt-4 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-bold text-mint">
            <CheckCircle2 size={18} /> Item {index + 1} done
          </span>
          <button onClick={handleNext} className="action-primary">
            {isLast ? `Finish ${kindLabel.toLowerCase()}` : 'Next item'}
          </button>
        </div>
      )}
    </div>
  );
}
