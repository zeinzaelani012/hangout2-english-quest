import { useState } from 'react';
import type { Activity, DiaryPromptPayload } from '../../types';
import { Check, ListChecks } from 'lucide-react';
import { type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

// ---- v2 guidedParagraph (W3 writing task) --------------------------------------

function GuidedParagraphBody({ activity, onResult }: Props) {
  const payload = activity.payload as Record<string, any>;
  const starters: string[] = payload.starters ?? [];
  const template: string | undefined = payload.template;
  const requirements: string[] = payload.requirements ?? [];
  const checklist: string[] = payload.checklist ?? [];
  const minimumWords: number = payload.minimumWords ?? 20;
  const ownSentencesRequired: number | undefined = payload.ownSentencesRequired;

  const [text, setText] = useState('');
  const [completed, setCompleted] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const wordsNeeded = Math.max(0, minimumWords - wordCount);

  const handleComplete = () => {
    setCompleted(true);
    onResult(true, {
      correctAnswer: 'Your own writing',
      rule: `You wrote ${wordCount} words across ${sentenceCount} sentences.`,
    });
  };

  const insertStarter = (starter: string) => {
    if (completed) return;
    setText(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? '\n' : '') + starter);
  };

  return (
    <div>
      <p className="mb-4 rounded-xl border border-violet/20 bg-violet/5 px-4 py-3 text-sm leading-6 text-ink">
        {payload.prompt ?? activity.prompt}
      </p>

      {template && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="eyebrow mb-2">Template</p>
          <p className="text-sm italic leading-6 text-ink">{template}</p>
          {ownSentencesRequired !== undefined && (
            <p className="mt-2 text-xs font-semibold text-muted">
              Then add {ownSentencesRequired} sentence{ownSentencesRequired > 1 ? 's' : ''} of your own.
            </p>
          )}
        </div>
      )}

      {starters.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Sentence starters — tap to use</p>
          <div className="flex flex-wrap gap-2">
            {starters.map((starter, i) => (
              <button
                key={i}
                onClick={() => insertStarter(starter)}
                disabled={completed}
                className="rounded-lg border border-violet/20 bg-violet/5 px-3 py-1.5 text-sm font-semibold text-writing transition-colors hover:bg-violet/10"
                style={{ minHeight: 36 }}
                aria-label={`Use starter: ${starter}`}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={completed}
        placeholder="Write your snack diary here..."
        rows={7}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Your writing"
      />

      <div className="mt-2 mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
        <span className="tnum">{wordCount} words</span>
        <span className="tnum">{sentenceCount} sentences</span>
        <span>Goal: {minimumWords} words{requirements.length > 0 ? ` · ${requirements.length} requirements` : ''}</span>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
          <ListChecks size={16} className="text-brand" /> Check your work
        </p>
        <div className="space-y-2">
          {requirements.map((item, i) => (
            <p key={`req-${i}`} className="flex min-h-6 items-center gap-2.5 text-sm text-ink">
              <span className="h-2 w-2 shrink-0 rounded-full bg-violet" aria-hidden />
              {item}
            </p>
          ))}
          {checklist.map((item, i) => (
            <p key={`chk-${i}`} className="flex min-h-6 items-center gap-2.5 text-sm text-ink">
              <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-hidden />
              {item}
            </p>
          ))}
        </div>
      </div>

      {!completed && (
        <button
          onClick={handleComplete}
          disabled={wordCount < minimumWords}
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
            Your writing is saved. Great work.
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Legacy diary prompt (Units 2/3) --------------------------------------------

function LegacyDiaryPrompt({ activity, onResult }: Props) {
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

export function DiaryPrompt(props: Props) {
  const raw = props.activity.payload as Record<string, any>;
  // v2 guidedParagraph payloads carry starters, a template or requirements.
  if (raw?.starters || raw?.template || raw?.requirements) {
    return <GuidedParagraphBody {...props} />;
  }
  return <LegacyDiaryPrompt {...props} />;
}
