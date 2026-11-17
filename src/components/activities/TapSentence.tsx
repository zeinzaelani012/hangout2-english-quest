import { useState } from 'react';
import type { Activity } from '../../types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { majorityCorrect, normalizeSentence, sentenceMatches, splitSentences, v2Items, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
  /** The reading passage — the answer space for tap-sentence items. */
  passage: string;
  passageTitle?: string;
}

interface TapSentenceItem {
  id?: string;
  q: string;
  answer?: string;
  answerType?: string;
  options?: string[];
  why?: string;
}

/**
 * TAP_SENTENCE — findSentence, gist, detail and any item with
 * answerType 'tapSentence'. The passage renders with each sentence as a
 * tappable unit; option items render as pills below the passage.
 */
export function TapSentence({ activity, onResult, passage, passageTitle }: Props) {
  const items: TapSentenceItem[] = v2Items(activity.payload);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const item = items[index];
  const isTap = !item?.options || item?.answerType === 'tapSentence';
  const answered = selected !== null;
  const isCorrect = answered && sentenceMatches(selected ?? '', item?.answer ?? '');
  const isLast = index >= items.length - 1;

  const sentences = splitSentences(passage);

  const finish = (finalResults: boolean[]) => {
    const correct = majorityCorrect(finalResults);
    const firstWrong = finalResults.findIndex(r => !r);
    onResult(correct, firstWrong >= 0 ? {
      correctAnswer: items[firstWrong].answer ?? '',
      rule: items[firstWrong].why ?? `The answer is in “${passageTitle ?? 'the text'}”.`,
    } : undefined);
  };

  const handleAnswer = (value: string) => {
    if (answered || !item) return;
    setSelected(value);
    const ok = sentenceMatches(value, item.answer ?? '');
    const nextResults = [...results, ok];
    setResults(nextResults);
    if (isLast) finish(nextResults);
  };

  // Dead-end guard: a tap item with no passage would trap the learner. It
  // should never trigger (answers are matched against the base texts), but if
  // it does, let them record the miss and move on.
  const handleMissingPassage = () => {
    if (answered || !item) return;
    setSelected('');
    const nextResults = [...results, false];
    setResults(nextResults);
    if (isLast) finish(nextResults);
  };

  const handleNext = () => {
    setIndex(i => i + 1);
    setSelected(null);
  };

  if (!item) return null;

  return (
    <div>
      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
        {passageTitle && <p className="eyebrow mb-3">{passageTitle}</p>}
        <div className="space-y-1">
          {sentences.map((sentence, i) => {
            const isPicked = selected === sentence;
            const isTheAnswer = sentenceMatches(sentence, item.answer ?? '');
            const showResult = answered && isTap && (isPicked || isTheAnswer);
            return (
              <button
                key={i}
                onClick={() => isTap && handleAnswer(sentence)}
                disabled={!isTap || answered}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm leading-6 transition-all ${
                  showResult && isTheAnswer
                    ? 'border-emerald-300 bg-emerald-50 text-ink ring-2 ring-emerald-200'
                    : showResult && isPicked && !isTheAnswer
                      ? 'border-red-300 bg-red-50 text-ink'
                      : isTap && !answered
                        ? 'border-transparent bg-white text-ink hover:border-brand/40 hover:bg-teal-50/40'
                        : 'border-transparent bg-white text-ink'
                }`}
                style={{ minHeight: 44 }}
                aria-label={`Sentence ${i + 1}`}
              >
                {sentence}
              </button>
            );
          })}
        </div>
      </div>

      {items.length > 1 && (
        <p className="eyebrow mb-2 tnum">Question {index + 1} of {items.length}</p>
      )}
      <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-ink">
        {item.q}
      </p>

      {!isTap && item.options && (
        <div className="flex flex-wrap gap-2.5">
          {item.options.map((option, i) => {
            const isSelected = selected === option;
            const isOptionCorrect = normalizeSentence(option) === normalizeSentence(item.answer ?? '');
            const showResult = answered && (isSelected || isOptionCorrect);
            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`min-h-11 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                  showResult && isOptionCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-mint ring-2 ring-emerald-200'
                    : showResult && isSelected && !isOptionCorrect
                      ? 'border-red-300 bg-red-50 text-coral ring-2 ring-red-200'
                      : 'border-slate-200 bg-white text-ink hover:border-brand/40 hover:bg-teal-50/50'
                }`}
                style={{ minHeight: 44 }}
                aria-label={`Option: ${option}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {isTap && !answered && sentences.length === 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-ink">The reading text for this question is unavailable.</p>
          <button onClick={handleMissingPassage} className="action-secondary mt-3 text-sm" style={{ minHeight: 44 }}>
            Mark unanswered and continue
          </button>
        </div>
      )}
      {isTap && !answered && sentences.length > 0 && (
        <p className="mb-1 rounded-xl border border-brand/30 bg-teal-50/60 px-4 py-3 text-sm font-bold text-ink">
          Find the exact words in the text. Do not guess.
        </p>
      )}

      {answered && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-mint" />
            ) : (
              <XCircle size={20} className="mt-0.5 shrink-0 text-coral" />
            )}
            <div>
              <p className="font-heading text-sm font-extrabold text-ink">
                {isCorrect ? 'Correct' : 'Review this answer'}
              </p>
              {!isCorrect && item.answer && (
                <p className="mt-1 text-sm leading-6 text-ink">
                  <span className="font-bold">Answer: </span>“{item.answer}”
                </p>
              )}
              {item.why && <p className="mt-1 text-sm leading-6 text-muted">{item.why}</p>}
            </div>
          </div>
        </div>
      )}

      {answered && !isLast && (
        <button onClick={handleNext} className="action-primary mt-4">
          Next question
        </button>
      )}
    </div>
  );
}
