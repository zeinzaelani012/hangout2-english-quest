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
        {payload.options.map((option, idx) => {
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
