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
      <div className="mb-4 p-4 rounded-card bg-writing/10">
        <p className="text-sm text-ink">{payload.prompt}</p>
      </div>

      {/* Word bank */}
      {payload.wordBank.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted mb-2">Word bank (tap to use):</p>
          <div className="flex flex-wrap gap-2">
            {payload.wordBank.map((word, i) => (
              <button
                key={i}
                onClick={() => setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + word)}
                className="px-3 py-1.5 rounded-pill bg-writing/10 text-writing text-sm font-medium hover:bg-writing/20 transition-colors"
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
        className="w-full p-4 rounded-card border border-gray-200 bg-white text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-y"
        aria-label="Your diary entry"
      />

      {/* Stats */}
      <div className="flex items-center gap-4 mt-2 mb-4">
        <span className="text-xs text-muted tnum">{wordCount} words</span>
        <span className="text-xs text-muted tnum">{sentenceCount} sentences</span>
        <span className="text-xs text-muted">Goal: {payload.minLength} sentences</span>
      </div>

      {/* Checklist */}
      <div className="mb-4 p-4 rounded-card bg-cream border border-gray-100">
        <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
          <ListChecks size={14} /> Check your work:
        </p>
        <div className="space-y-2">
          {payload.checklist.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={e => setChecks(prev => prev.map((c, idx) => idx === i ? e.target.checked : c))}
                className="w-5 h-5 rounded"
              />
              <span className={`text-sm ${checks[i] ? 'text-mint font-medium' : 'text-ink'}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Complete button */}
      {!completed && (
        <button
          onClick={handleComplete}
          disabled={sentenceCount < 1}
          className="w-full py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors disabled:opacity-40"
          style={{ minHeight: 44 }}
        >
          Save and complete
        </button>
      )}

      {completed && (
        <div className="p-3 rounded-card bg-mint/10">
          <p className="text-sm text-ink flex items-center gap-2">
            <Check size={18} className="text-mint" />
            Your diary entry is saved! Great writing.
          </p>
        </div>
      )}
    </div>
  );
}
