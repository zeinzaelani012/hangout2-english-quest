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
 * CHECKPOINT_RUNNER — checkpoint (CP1), boss and mixedRecall. Not a new
 * mechanic: the payload's items render through the mechanics above, one at a
 * time, behind a single progress bar. XP is awarded once at the end.
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
    id: `${activity.id}-${item.id ?? index}`,
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
    body = <p className="text-sm text-muted">This activity type is not yet supported.</p>;
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
      <div key={sub.id}>{body}</div>

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
