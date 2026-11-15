import { useState, useEffect } from 'react';
import type { Activity, GapFillPayload } from '../../types';
import { Check, X } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function GapFill({ activity, onResult }: Props) {
  const payload = activity.payload as GapFillPayload;
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Split sentence at ___ to show the blank
  const parts = payload.sentence.split('___');

  const handleSelect = (option: string) => {
    if (answered) return;
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
      {/* Sentence with blank */}
      <div className="mb-6 p-4 rounded-card bg-cream border border-gray-100">
        <p className="text-lg text-ink leading-relaxed">
          {parts[0]}
          <span
            className={`inline-block min-w-[80px] mx-1 px-3 py-1 rounded-pill font-medium text-center ${
              answered
                ? selected === payload.answer
                  ? 'bg-mint/20 text-mint'
                  : 'bg-coral/20 text-coral'
                : 'bg-white border-2 border-dashed border-brand/30 text-brand'
            }`}
          >
            {selected || '___'}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* Options as pill buttons */}
      <div className="flex flex-wrap gap-2.5">
        {payload.options.map((option, idx) => {
          const isSelected = selected === option;
          const isCorrect = option === payload.answer;
          const showResult = answered && (isSelected || isCorrect);

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`px-5 py-2.5 rounded-pill font-medium text-sm transition-all ${
                showResult && isCorrect
                  ? 'bg-mint/15 text-mint ring-2 ring-mint'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-coral/15 text-coral ring-2 ring-coral'
                    : 'bg-white shadow-card text-ink hover:shadow-cardhover'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`Option: ${option}`}
            >
              {option}
              {showResult && isCorrect && <Check size={16} className="inline ml-1.5" />}
              {showResult && isSelected && !isCorrect && <X size={16} className="inline ml-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
