import { useState, useRef, useEffect } from 'react';
import type { Activity, PictureMatchPayload } from '../../types';
import { VocabIllustration } from '../Illustrations';
import { Check, X } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function PictureMatch({ activity, onResult }: Props) {
  const payload = activity.payload as PictureMatchPayload;
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const showPictures = activity.difficulty !== 'challenging';

  useEffect(() => {
    optionRefs.current[0]?.focus();
  }, []);

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);

    const isCorrect = optionId === payload.answerId;
    const correctOption = payload.options.find(o => o.id === payload.answerId);
    onResult(isCorrect, {
      correctAnswer: correctOption?.label || payload.prompt,
      rule: payload.why,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (answered) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % payload.options.length;
      setFocusedIdx(next);
      optionRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + payload.options.length) % payload.options.length;
      setFocusedIdx(prev);
      optionRefs.current[prev]?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleSelect(payload.options[idx].id);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {payload.options.map((option, idx) => {
          const isSelected = selected === option.id;
          const isCorrect = option.id === payload.answerId;
          const showResult = answered && (isSelected || isCorrect);

          return (
            <button
              key={option.id}
              ref={el => { optionRefs.current[idx] = el; }}
              onClick={() => handleSelect(option.id)}
              onKeyDown={e => handleKeyDown(e, idx)}
              className={`relative flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                showResult && isCorrect
                  ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                  : showResult && isSelected && !isCorrect
                    ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                    : 'border-slate-200 bg-white hover:border-brand/40 hover:bg-teal-50/50'
              }`}
              style={{ minHeight: 120 }}
              aria-label={option.label}
              disabled={answered}
            >
              {showPictures && option.imgHint && (
                <VocabIllustration imgHint={option.imgHint} size={60} />
              )}
              <span className="font-heading text-sm font-bold text-ink sm:text-base">
                {option.label}
              </span>
              {showResult && isCorrect && <Check size={20} className="absolute right-2 top-2 text-mint" />}
              {showResult && isSelected && !isCorrect && <X size={20} className="absolute right-2 top-2 text-coral" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
