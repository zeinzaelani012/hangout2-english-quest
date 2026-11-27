import { useEffect, useMemo, useState } from 'react';
import type { Activity, GapFillPayload } from '../../types';
import { Check, X } from 'lucide-react';
import { AudioButton } from '../AudioButton';
import { playUiSound } from '../../lib/audio';
import { seededShuffle } from '../../lib/shuffle';
import { VocabIllustration } from '../Illustrations';
import { majorityCorrect, renderStemParts, v2Items, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
  /** D1 reason chip: notified when the learner picks the correct reason (+1 XP). */
  onBonus?: () => void;
}

// ---- v2 CHOICE_ITEM -----------------------------------------------------------
// types: pictureToWord, wordToPicture, audioToWord, audioQuestion, gapFill,
// oddOneOut, questionForms, transform, preReadVocab, notice, audioToPicture,
// audioGapFill.

interface ChoiceItemSpec {
  id?: string;
  stem?: string;
  img?: string;
  audio?: string;
  options: string[];
  answer: string;
  why?: string;
  instruction?: string;
}

function instructionFor(type: string, raw: Record<string, any>): string | undefined {
  switch (type) {
    case 'questionForms':
      return `Answer: “${raw.answerLine}”`;
    case 'transform':
      return raw.instruction ? `${raw.instruction}: “${raw.from}”` : `“${raw.from}”`;
    case 'notice':
    case 'audioQuestion':
      return raw.q;
    default:
      return raw.q ?? raw.instruction;
  }
}

function toSpec(type: string, raw: Record<string, any>): ChoiceItemSpec {
  return {
    id: raw.id,
    stem: raw.sentence ?? raw.word,
    img: raw.img,
    audio: raw.audio,
    options: raw.options ?? raw.words ?? [],
    answer: raw.answer,
    why: raw.why,
    instruction: instructionFor(type, raw),
  };
}

function ChoiceItemBody({ activity, onResult, onBonus }: Props) {
  const payload = activity.payload as Record<string, any>;
  const items: ChoiceItemSpec[] = v2Items(payload).map(raw => toSpec(activity.type, raw));
  const whyChoices: string[] = payload.whyChoices ?? [];
  const teachCard = payload.teachCard as
    | { title: string; lines: string[]; rule: string }
    | undefined;
  // wordToPicture / audioToPicture: the options are words that render as
  // pictures — the learner taps the image, not the word.
  const pictureOptions = activity.type === 'wordToPicture' || activity.type === 'audioToPicture';
  // audioGapFill carries one clip for the whole slot (L3); show it once.
  const slotAudio: string | undefined = activity.type === 'audioGapFill' ? payload.audio : undefined;
  // Part G replay limits — listening items only: Easy unlimited, Core 2,
  // Challenging 1. Counted per item (AudioButton resets when the item changes).
  const isListeningItem =
    activity.type === 'audioToWord' ||
    activity.type === 'audioQuestion' ||
    activity.type === 'audioToPicture' ||
    activity.type === 'audioGapFill';
  const maxPlays: number | undefined = !isListeningItem
    ? undefined
    : activity.difficulty === 'challenging'
      ? 1
      : activity.difficulty === 'core'
        ? 2
        : undefined;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  // Part J — the words behind "Show the words" once the item is answered.
  const [showWords, setShowWords] = useState(false);
  // D1 reason chip: the learner must pick a reason before the explanation
  // appears. The pack's whyChoices are ordered best-first, so the first chip
  // is the correct reason.
  const [reason, setReason] = useState<string | null>(null);
  const reasonCorrect = reason !== null && reason === whyChoices[0];

  const item = items[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === item?.answer;
  const isLast = index >= items.length - 1;

  // The packs list the correct option first in most items — reorder per item,
  // seeded so the order stays stable while the learner works on it.
  const optionOrder = useMemo(
    () => items.map((it, i) =>
      seededShuffle(it.options, `${activity.unitId ?? 0}:${activity.id}:${it.id ?? ''}:${i}`)),
    // items derive from the same payload every render; the activity id pins them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity.id],
  );
  const itemOptions = optionOrder[index] ?? item?.options ?? [];

  // whyChoices are authored best-first (the first chip is the correct reason) —
  // shuffle the display for the same reason as the answers.
  const reasonChips = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => seededShuffle(whyChoices, `${activity.unitId ?? 0}:${activity.id}:${index}:why`),
    [activity.id, index],
  );

  const finish = (finalResults: boolean[]) => {
    const correct = majorityCorrect(finalResults);
    const firstWrong = finalResults.findIndex(r => !r);
    onResult(correct, firstWrong >= 0 ? {
      correctAnswer: items[firstWrong].answer,
      rule: items[firstWrong].why ?? '',
    } : undefined);
  };

  const handleSelect = (option: string) => {
    if (answered || !item) return;
    playUiSound(option === item.answer ? 'correct' : 'retry');
    setSelected(option);
    const nextResults = [...results, option === item.answer];
    setResults(nextResults);
    if (isLast) finish(nextResults);
  };

  // Keyboard 1–9 shortcuts (ignored while typing in an input)
  useEffect(() => {
    if (answered || !item) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= Math.min(9, itemOptions.length)) {
        handleSelect(itemOptions[n - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleReason = (chip: string) => {
    if (reason) return;
    setReason(chip);
    // The +1 XP depth bonus exists only where the pack actually explains the
    // rule (item.why present). For self-report items without a why there is
    // no right answer to reward.
    if (chip === whyChoices[0] && item.why) onBonus?.();
  };

  const handleNext = () => {
    playUiSound('next');
    setIndex(i => i + 1);
    setSelected(null);
    setReason(null);
    setShowWords(false);
  };

  if (!item) return null;

  return (
    <div>
      {teachCard && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-heading text-sm font-extrabold text-ink">{teachCard.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {teachCard.lines.map((line, i) => (
              <span key={i} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink">
                {line}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-xs leading-5 text-muted">{teachCard.rule}</p>
        </div>
      )}

      <div className="mb-5">
        {items.length > 1 && (
          <p className="eyebrow mb-2 tnum">Item {index + 1} of {items.length}</p>
        )}
        {slotAudio && (
          <div className="mb-3">
            <AudioButton
              key={`choice-slot-audio-${activity.id}-${item.id ?? index}`}
              audioKey={`choice-slot-${activity.id}-${item.id ?? index}`}
              fallbackText={slotAudio}
              rate={activity.difficulty === 'challenging' ? 1.0 : 0.9}
              label="Listen to the clip"
              maxPlays={maxPlays}
              level={activity.difficulty}
            />
          </div>
        )}
        {item.instruction && (
          <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-ink">
            {item.instruction}
          </p>
        )}
        {item.audio && (
          <div className="mb-3">
            <AudioButton
              key={`choice-item-audio-${activity.id}-${item.id ?? index}`}
              audioKey={`choice-${activity.id}-${item.id ?? index}`}
              fallbackText={item.audio}
              rate={activity.difficulty === 'challenging' ? 1.0 : 0.9}
              label="Listen"
              maxPlays={maxPlays}
              level={activity.difficulty}
            />
          </div>
        )}
        {item.img && (
          <div className="mb-3 flex justify-center">
            <VocabIllustration imgHint={item.img} size={96} />
          </div>
        )}
        {item.stem && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-lg leading-8 text-ink sm:text-xl">
            {renderStemParts(item.stem).map((part, i) =>
              part === 'blank' ? (
                <span
                  key={i}
                  className={`mx-1 inline-block min-w-20 rounded-lg border px-3 py-1.5 text-center font-bold ${
                    answered
                      ? isCorrect
                        ? 'border-emerald-200 bg-emerald-100 text-mint'
                        : 'border-red-200 bg-red-100 text-coral'
                      : 'border-dashed border-brand/40 bg-white text-brand'
                  }`}
                >
                  {answered ? selected : '___'}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        )}
      </div>

      {pictureOptions ? (
        /* Picture choice: options render as illustrations, no words */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {itemOptions.map((option, i) => {
            const isSelected = selected === option;
            const isOptionCorrect = option === item.answer;
            const showResult = answered && (isSelected || isOptionCorrect);
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                disabled={answered}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                  showResult && isOptionCorrect
                    ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                    : showResult && isSelected && !isOptionCorrect
                      ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                      : 'border-slate-200 bg-white hover:border-brand/40 hover:bg-teal-50/50'
                }`}
                style={{ minHeight: 44 }}
                aria-label={`Option ${i + 1}: ${option}`}
              >
                <VocabIllustration imgHint={option} size={72} />
                <span className="tnum inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-muted">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
      <div className="flex flex-wrap gap-2.5">
        {itemOptions.map((option, i) => {
          const isSelected = selected === option;
          const isOptionCorrect = option === item.answer;
          const showResult = answered && (isSelected || isOptionCorrect);
          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`min-h-11 rounded-xl border px-5 py-2.5 text-left text-sm font-bold transition-all ${
                showResult && isOptionCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-mint ring-2 ring-emerald-200'
                  : showResult && isSelected && !isOptionCorrect
                    ? 'border-red-300 bg-red-50 text-coral ring-2 ring-red-200'
                    : 'border-slate-200 bg-white text-ink hover:border-brand/40 hover:bg-teal-50/50'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`Option ${i + 1}: ${option}`}
            >
              <span className="tnum mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-muted">
                {i + 1}
              </span>
              {option}
              {showResult && isOptionCorrect && <Check size={16} className="ml-1.5 inline" />}
              {showResult && isSelected && !isOptionCorrect && <X size={16} className="ml-1.5 inline" />}
            </button>
          );
        })}
      </div>
      )}

      {/* Part J — text alternative for listening items, behind "Show the
          words" once this item is answered. Makes the item usable by a deaf
          learner without turning the station into a reading station. */}
      {answered && (item.audio || slotAudio) && (
        <div className="mt-4">
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
              {item.audio ?? slotAudio}
            </p>
          )}
        </div>
      )}

      {/* D1 reason chip — PHASE 10: this is a SELF-REPORT, not a check. The
          chip always appears when the slot declares whyChoices, even when the
          item has no `why` of its own (347 items across L1/V3/G2/V8). When a
          why exists it is shown after the chip as the pack's explanation —
          the learner's chosen chip is never marked wrong, and no empty
          explanation box is ever rendered when it is absent. */}
      {answered && whyChoices.length > 0 && !reason && (
        <div className="mt-4 rounded-xl border border-brand/30 bg-teal-50/50 p-4">
          <p className="mb-3 text-sm font-bold text-ink">Why is that the right answer?</p>
          <div className="flex flex-wrap gap-2">
            {reasonChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleReason(chip)}
                className="min-h-9 rounded-full border border-brand/30 bg-white px-3.5 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-teal-50"
                style={{ minHeight: 36 }}
                aria-label={`Reason: ${chip}`}
              >
                {chip}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Pick a reason to see the rule — it cannot be skipped, and any choice keeps you going.</p>
        </div>
      )}

      {answered && (whyChoices.length === 0 || reason !== null) && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
          aria-live="polite"
          role="status"
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <Check size={20} className="mt-0.5 shrink-0 text-mint" />
            ) : (
              <X size={20} className="mt-0.5 shrink-0 text-coral" />
            )}
            <div>
              <p className="font-heading text-sm font-extrabold text-ink">
                {isCorrect ? 'Correct' : 'Review this answer'}
                {reason && reasonCorrect && item.why && (
                  <span className="ml-2 inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-mint">
                    +1 XP
                  </span>
                )}
              </p>
              {!isCorrect && (
                <p className="mt-1 text-sm leading-6 text-ink">
                  <span className="font-bold">Answer: </span>{item.answer}
                </p>
              )}
              {/* Only a REAL why renders. Absence is a normal state — never an
                  empty explanation box, and never a fabricated rule. */}
              {item.why && <p className="mt-1 text-sm leading-6 text-muted">{item.why}</p>}
            </div>
          </div>
        </div>
      )}

      {answered && (whyChoices.length === 0 || reason !== null) && !isLast && (
        <button onClick={handleNext} className="action-primary mt-4">
          Next item
        </button>
      )}
    </div>
  );
}

// ---- Legacy single-item GapFill (Units 2/3) ----------------------------------

function LegacyGapFill({ activity, onResult }: Props) {
  const payload = activity.payload as GapFillPayload;

  // v2 (expanded pack) payloads are slot entries with an items array.
  if (Array.isArray((payload as Record<string, any>)?.items)) {
    return <ChoiceItemBody activity={activity} onResult={onResult} />;
  }

  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const shuffledOptions = useMemo(
    () => seededShuffle(payload.options, `${activity.unitId ?? 0}:${activity.id}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity.id, payload.options],
  );

  // Split sentence at ___ to show the blank
  const parts = payload.sentence.split('___');

  const handleSelect = (option: string) => {
    if (answered) return;
    playUiSound(option === payload.answer ? 'correct' : 'retry');
    setSelected(option);
    setAnswered(true);
    const isCorrect = option === payload.answer;
    onResult(isCorrect, {
      correctAnswer: payload.answer,
      rule: payload.why,
    });
  };

  return (
    <div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg leading-8 text-ink sm:text-xl">
          {parts[0]}
          <span
            className={`mx-1 inline-block min-w-[80px] rounded-lg border px-3 py-1.5 text-center font-bold ${
              answered
                ? selected === payload.answer
                  ? 'border-emerald-200 bg-emerald-100 text-mint'
                  : 'border-red-200 bg-red-100 text-coral'
                : 'border-dashed border-brand/40 bg-white text-brand'
            }`}
          >
            {selected || '___'}
          </span>
          {parts[1]}
        </p>
      </div>

      <p className="eyebrow mb-3">Choose the word</p>
      <div className="flex flex-wrap gap-2.5">
        {shuffledOptions.map((option, idx) => {
          const isSelected = selected === option;
          const isCorrect = option === payload.answer;
          const showResult = answered && (isSelected || isCorrect);

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`min-h-11 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                showResult && isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-mint ring-2 ring-emerald-200'
                  : showResult && isSelected && !isCorrect
                    ? 'border-red-300 bg-red-50 text-coral ring-2 ring-red-200'
                    : 'border-slate-200 bg-white text-ink hover:border-brand/40 hover:bg-teal-50/50'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`Option: ${option}`}
            >
              {option}
              {showResult && isCorrect && <Check size={16} className="ml-1.5 inline" />}
              {showResult && isSelected && !isCorrect && <X size={16} className="ml-1.5 inline" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GapFill(props: Props) {
  // v2 (expanded pack) payloads are slot entries with an items array.
  if (Array.isArray((props.activity.payload as Record<string, any>)?.items)) {
    return <ChoiceItemBody {...props} />;
  }
  return <LegacyGapFill {...props} />;
}
