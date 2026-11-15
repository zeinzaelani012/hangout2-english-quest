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
              className={`relative rounded-card p-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[120px] ${
                showResult && isCorrect
                  ? 'bg-mint/10 ring-2 ring-mint'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-coral/10 ring-2 ring-coral'
                    : 'bg-cream hover:bg-white border border-gray-100 shadow-card'
              }`}
              style={{ minHeight: 120 }}
              aria-label={option.label}
              disabled={answered}
            >
              {showPictures && option.imgHint && (
                <VocabIllustration imgHint={option.imgHint} size={60} />
              )}
              <span className="font-heading font-700 text-ink text-sm sm:text-base">
                {option.label}
              </span>
              {showResult && isCorrect && <Check size={20} className="text-mint absolute top-2 right-2" />}
              {showResult && isSelected && !isCorrect && <X size={20} className="text-coral absolute top-2 right-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
