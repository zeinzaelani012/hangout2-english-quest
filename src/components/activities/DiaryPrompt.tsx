import { useState } from 'react';
import type { Activity, DiaryPromptPayload } from '../../types';
import { Check, ListChecks } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function DiaryPrompt({ activity, onResult }: Props) {
  const payload = activity.payload as DiaryPromptPayload;
  const [text, setText] = useState('');
  const [checks, setChecks] = useState<boolean[]>(payload.checklist.map(() => false));
  const [completed, setCompleted] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  const handleComplete = () => {
    setCompleted(true);
    const passed = checks.every(c => c) && sentenceCount >= payload.minLength;
    onResult(true, {
      correctAnswer: 'Your own writing',
      rule: `You wrote ${sentenceCount} sentences. ${passed ? 'All checks passed!' : 'Try to complete all checklist items next time.'}`,
    });
  };

  return (
    <div>
      {/* Prompt */}
      <div className="mb-4 rounded-xl border border-violet/20 bg-violet/5 p-4">
        <p className="text-sm leading-6 text-ink">{payload.prompt}</p>
      </div>

      {/* Word bank */}
      {payload.wordBank.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Useful words</p>
          <div className="flex flex-wrap gap-2">
            {payload.wordBank.map((word, i) => (
              <button
                key={i}
                onClick={() => setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + word)}
                className="rounded-lg border border-violet/20 bg-violet/5 px-3 py-1.5 text-sm font-semibold text-writing transition-colors hover:bg-violet/10"
                style={{ minHeight: 36 }}
                aria-label={`Add "${word}" to your writing`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={completed}
        placeholder="Write your diary entry here..."
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Your diary entry"
      />

      {/* Stats */}
      <div className="mb-4 mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
        <span className="tnum">{wordCount} words</span>
        <span className="tnum">{sentenceCount} sentences</span>
        <span>Goal: {payload.minLength} sentences</span>
      </div>

      {/* Checklist */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
          <ListChecks size={16} className="text-brand" /> Check your work
        </p>
        <div className="space-y-2">
          {payload.checklist.map((item, i) => (
            <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={e => setChecks(prev => prev.map((c, idx) => idx === i ? e.target.checked : c))}
                className="h-5 w-5 rounded border-slate-300 text-brand"
              />
              <span className={`text-sm ${checks[i] ? 'font-semibold text-mint' : 'text-ink'}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Complete button */}
      {!completed && (
        <button
          onClick={handleComplete}
          disabled={sentenceCount < 1}
          className="action-primary w-full"
          style={{ minHeight: 44 }}
        >
          Save and complete
        </button>
      )}

      {completed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Check size={18} className="text-mint" />
            Your diary entry is saved. Great writing.
          </p>
        </div>
      )}
    </div>
  );
}
