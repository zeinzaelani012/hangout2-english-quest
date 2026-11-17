import { useState } from 'react';
import type { Activity } from '../../types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { majorityCorrect, normalizeSentence, v2Items, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

interface TapTokenItem {
  id?: string;
  sentence: string;
  wrong: string;
  correct: string;
  why?: string;
}

/**
 * TAP_TOKEN — errorCorrection. The sentence renders as tappable word tokens;
 * tapping the wrong word reveals the corrected sentence. Wrong taps highlight
 * and the learner retries.
 */
export function TapToken({ activity, onResult }: Props) {
  const items: TapTokenItem[] = v2Items(activity.payload);
  const [index, setIndex] = useState(0);
  const [wrongToken, setWrongToken] = useState<string | null>(null);
  const [solved, setSolved] = useState<boolean[]>([]);

  const item = items[index];
  const isLast = index >= items.length - 1;

  const handleNext = () => {
    setIndex(i => i + 1);
    setWrongToken(null);
  };

  const completeItem = () => {
    const next = [...solved, true];
    setSolved(next);
    if (isLast) {
      onResult(majorityCorrect(next), {
        correctAnswer: items.map(i => `${i.sentence} → ${i.correct}`).join('; '),
        rule: items[0]?.why ?? 'Find the one wrong word in each sentence.',
      });
    }
  };

  if (!item) return null;

  const tokens = item.sentence.split(/\s+/);
  const normalizedWrong = normalizeSentence(item.wrong);
  const itemDone = solved.length > index;
  // Rebuild from tokens so a wrong word like "do" is never replaced inside a
  // longer token such as "doesn't" (string.replace would corrupt it).
  const corrected = item.sentence
    .split(/\s+/)
    .map(tok => {
      const m = tok.match(/^(.*?)([.,!?;:'"]*)$/);
      const core = (m?.[1] ?? tok).toLowerCase();
      const punct = m?.[2] ?? '';
      return core === item.wrong.toLowerCase() ? item.correct + punct : tok;
    })
    .join(' ');

  const handleTap = (token: string) => {
    if (itemDone) return;
    if (normalizeSentence(token) === normalizedWrong) {
      setWrongToken(null);
      completeItem();
    } else {
      setWrongToken(token);
    }
  };

  return (
    <div>
      {items.length > 1 && (
        <p className="eyebrow mb-2 tnum">Item {index + 1} of {items.length}</p>
      )}
      <p className="mb-3 text-sm text-muted">Tap the wrong word in the sentence.</p>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-5">
        {tokens.map((token, i) => {
          const isWrongTap = wrongToken === token;
          const isTheError = itemDone && normalizeSentence(token) === normalizedWrong;
          return (
            <button
              key={i}
              onClick={() => handleTap(token)}
              disabled={itemDone}
              className={`min-h-11 rounded-lg border px-3 py-2 text-base font-semibold transition-all ${
                isTheError
                  ? 'border-emerald-300 bg-emerald-50 text-mint ring-2 ring-emerald-200'
                  : isWrongTap
                    ? 'animate-pulse border-red-300 bg-red-50 text-coral'
                    : 'border-slate-200 bg-white text-ink hover:border-brand/40'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`Word: ${token}`}
            >
              {token}
            </button>
          );
        })}
      </div>

      {wrongToken && !itemDone && (
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-coral" role="status">
          <XCircle size={18} /> “{wrongToken}” is correct — keep looking for the mistake.
        </p>
      )}

      {itemDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status" aria-live="polite">
          <p className="flex items-center gap-2 font-heading text-sm font-extrabold text-ink">
            <CheckCircle2 size={18} className="text-mint" /> Corrected sentence
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-ink">
            <span className="text-coral line-through">{item.wrong}</span>{' '}
            <span className="text-mint">{item.correct}</span>
            {' — '}
            {corrected}
          </p>
          {item.why && <p className="mt-1 text-sm leading-6 text-muted">{item.why}</p>}
        </div>
      )}

      {itemDone && !isLast && (
        <button onClick={handleNext} className="action-primary mt-4">
          Next item
        </button>
      )}
    </div>
  );
}
