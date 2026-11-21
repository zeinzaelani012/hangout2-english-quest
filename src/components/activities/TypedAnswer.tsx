import { useState } from 'react';
import type { Activity } from '../../types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { damerauLevenshtein, normaliseForMatch, spelledOut } from '../../lib/normalise';
import { VocabIllustration } from '../Illustrations';
import { AudioButton } from '../AudioButton';
import { majorityCorrect, normalizeSentence, v2Items, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

interface TypedItem {
  id?: string;
  prompt?: string;
  img?: string;
  audio?: string;
  wrong?: string;
  answer: string;
}

/** Word-level diff between the learner's sentence and the answer. */
function diffWords(user: string, answer: string): { word: string; ok: boolean }[] {
  const userWords = normalizeSentence(user).split(' ').filter(Boolean);
  const answerWords = normalizeSentence(answer).split(' ').filter(Boolean);
  const len = Math.max(userWords.length, answerWords.length);
  const out: { word: string; ok: boolean }[] = [];
  for (let i = 0; i < len; i++) {
    const u = userWords[i];
    const a = answerWords[i];
    if (u !== undefined) out.push({ word: u, ok: u === a });
  }
  return out;
}

/**
 * TYPED_ANSWER — typeIt and sentenceRepair. typeIt accepts a Levenshtein
 * distance ≤ 1 on answers of 5+ letters; sentenceRepair compares normalised
 * strings and shows a word-level diff.
 */
export function TypedAnswer({ activity, onResult }: Props) {
  const isRepair = activity.type === 'sentenceRepair';
  const items: TypedItem[] = v2Items(activity.payload);

  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const item = items[index];
  const isLast = index >= items.length - 1;

  // Whether the accepted answer came through the typo tolerance — the UI must
  // say so plainly ("Close enough — the word is spelled s-c-h-o-o-l."), never
  // accept silently. The spelling is the point.
  const [acceptedAsTypo, setAcceptedAsTypo] = useState(false);

  const evaluate = (value: string): { ok: boolean; typo: boolean } => {
    if (!item) return { ok: false, typo: false };
    const answer = normaliseForMatch(item.answer);
    const user = normaliseForMatch(value);
    if (isRepair) {
      return { ok: user === answer, typo: false };
    }
    // typeIt: exact match, or a Damerau-Levenshtein distance ≤ 1 (insertion,
    // deletion, substitution OR transposition) — never for answers shorter
    // than four characters, and only when the item allows it.
    if (user === answer) return { ok: true, typo: false };
    const allowTypo = (item as any).allowOneLetterTypo !== false;
    const ok = allowTypo && answer.length >= 4 && damerauLevenshtein(user, answer) <= 1;
    return { ok, typo: ok };
  };

  const handleCheck = () => {
    if (!item) return;
    const { ok, typo } = evaluate(text);
    setAcceptedAsTypo(typo);
    setChecked(true);
    // Store the result per item so a retry replaces the previous attempt
    // instead of counting the item twice.
    const next = [...results];
    next[index] = ok;
    setResults(next);
    if (isLast) {
      onResult(majorityCorrect(next.filter((r): r is boolean => typeof r === 'boolean')), {
        correctAnswer: items.map(i => i.answer).join('; '),
        rule: isRepair ? 'Type the corrected sentence in full.' : 'Check your spelling carefully.',
      });
    }
  };

  const handleNext = () => {
    setIndex(i => i + 1);
    setText('');
    setChecked(false);
    setAcceptedAsTypo(false);
  };

  const handleRetry = () => {
    setChecked(false);
    setText('');
    setAcceptedAsTypo(false);
  };

  if (!item) return null;

  const isCorrect = checked && evaluate(text).ok;

  return (
    <div>
      {items.length > 1 && (
        <p className="eyebrow mb-2 tnum">Item {index + 1} of {items.length}</p>
      )}

      {isRepair && item.wrong && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-ink">
          <span className="font-bold text-coral">Wrong: </span>
          <span className="line-through">{item.wrong}</span>
        </p>
      )}

      {!isRepair && item.img && (
        <div className="mb-4 flex justify-center">
          <VocabIllustration imgHint={item.img} size={96} />
        </div>
      )}

      {!isRepair && item.audio && (
        <div className="mb-4">
          <AudioButton
            audioKey={`typed-${activity.id}-${item.id ?? index}`}
            fallbackText={item.audio}
            rate={0.85}
            label="Hear the word"
          />
        </div>
      )}

      {(item.prompt || isRepair) && (
        <label htmlFor={`typed-${activity.id}-${index}`} className="mb-2 block text-sm font-bold text-ink">
          {item.prompt ?? 'Type the corrected sentence:'}
        </label>
      )}

      <textarea
        id={`typed-${activity.id}-${index}`}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={checked}
        rows={isRepair ? 2 : 1}
        placeholder={isRepair ? 'Type the full corrected sentence…' : 'Type your answer…'}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label={item.prompt ?? 'Typed answer'}
      />

      {!checked && (
        <button
          onClick={handleCheck}
          disabled={text.trim().length === 0}
          className="action-primary mt-4 w-full"
        >
          Check answer
        </button>
      )}

      {checked && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="flex items-center gap-2 font-heading text-sm font-extrabold text-ink">
            {isCorrect ? <CheckCircle2 size={18} className="text-mint" /> : <XCircle size={18} className="text-coral" />}
            {isCorrect ? 'Correct' : 'Check the difference'}
          </p>
          {isCorrect && acceptedAsTypo && !isRepair && (
            <p className="mt-1 text-sm font-semibold text-sun">
              Close enough — the word is spelled {spelledOut(item.answer.replace(/[.!?]+$/, ''))}.
            </p>
          )}
          {!isCorrect && isRepair && text.trim() && (
            <p className="mt-2 text-sm leading-7">
              {diffWords(text, item.answer).map((w, i) => (
                <span
                  key={i}
                  className={w.ok ? 'text-ink' : 'rounded bg-red-100 px-1 font-bold text-coral line-through'}
                >
                  {w.word}{' '}
                </span>
              ))}
            </p>
          )}
          {!isCorrect && (
            <p className="mt-2 text-sm font-bold leading-6 text-ink">Answer: {item.answer}</p>
          )}
        </div>
      )}

      {checked && !isCorrect && !isLast && (
        <button onClick={handleRetry} className="action-secondary mt-4">
          Try again
        </button>
      )}

      {checked && !isLast && (
        <button onClick={handleNext} className="action-primary mt-4">
          Next item
        </button>
      )}
    </div>
  );
}
