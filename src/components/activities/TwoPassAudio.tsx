import { useState } from 'react';
import type { Activity } from '../../types';
import { Check, Lock, Volume2 } from "lucide-react";
import { AudioButton } from '../AudioButton';
import { majorityCorrect, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

interface TwoPassQuestion {
  pass: number;
  job?: 'gist' | 'detail';
  q: string;
  options: string[];
  answer: string;
}

/**
 * TWO_PASS_AUDIO — twoPass. Pass 1 (gist) unlocks after the first play;
 * after it is answered, the clip plays again for pass 2 (detail). The
 * transcript toggle stays disabled until both passes are answered. Replays
 * beyond the first pair count against the item's replay allowance.
 */
export function TwoPassAudio({ activity, onResult }: Props) {
  const payload = activity.payload as Record<string, any>;
  const passes: TwoPassQuestion[] = payload.passes ?? [];
  const audio: string = payload.audio ?? '';

  const [q1Selected, setQ1Selected] = useState<string | null>(null);
  const [q2Selected, setQ2Selected] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [plays, setPlays] = useState(0);

  const q1 = passes[0];
  const q2 = passes[1];
  const replayAllowance: number = payload.replayAllowance ?? 2;
  const q1Answered = q1Selected !== null;
  const q2Answered = q2Selected !== null;
  const bothAnswered = q1Answered && q2Answered;
  const canAnswerQ1 = plays >= 1;
  const canAnswerQ2 = q1Answered && plays >= 2;
  const replaysUsed = Math.max(0, plays - 2);
  const outOfReplays = plays >= 2 + replayAllowance;
  const q1Correct = q1Answered && q1Selected === q1?.answer;
  const q2Correct = q2Answered && q2Selected === q2?.answer;

  const handleQ1 = (option: string) => {
    if (q1Answered || !canAnswerQ1) return;
    setQ1Selected(option);
  };

  const handleQ2 = (option: string) => {
    if (q2Answered || !canAnswerQ2) return;
    setQ2Selected(option);
    // Both passes answered — award once at the end.
    if (q1) {
      onResult(
        majorityCorrect([q1Selected === q1.answer, option === q2.answer]),
        { correctAnswer: `${q1.answer}; ${q2.answer}`, rule: 'Listen once for the gist, once for detail.' },
      );
    }
  };

  if (!q1 || !q2) return null;

  const renderQuestion = (
    question: TwoPassQuestion,
    selected: string | null,
    answered: boolean,
    correct: boolean,
    onSelect: (option: string) => void,
    locked: boolean,
    passLabel: string,
    hidden: boolean,
  ) => (
    <div className={`rounded-xl border p-4 ${locked ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow">
          {passLabel} · {question.job === 'detail' ? 'Listen for detail' : 'Listen for the gist'}
        </p>
        {locked && <Lock size={14} className="text-muted" />}
      </div>
      {hidden ? (
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted">
          <Volume2 size={15} className="shrink-0 text-brand" aria-hidden /> Listen first — the question appears after the audio plays.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm font-bold leading-6 text-ink">{question.q}</p>
          <div className="flex flex-wrap gap-2.5">
            {question.options.map((option, i) => {
              const isSelected = selected === option;
              const isOptionCorrect = option === question.answer;
              const showResult = answered && (isSelected || isOptionCorrect);
              return (
                <button
                  key={i}
                  onClick={() => onSelect(option)}
                  disabled={answered || locked}
                  className={`min-h-11 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                    showResult && isOptionCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-mint ring-2 ring-emerald-200'
                      : showResult && isSelected && !isOptionCorrect
                        ? 'border-red-300 bg-red-50 text-coral ring-2 ring-red-200'
                        : 'border-slate-200 bg-white text-ink hover:border-brand/40 hover:bg-teal-50/50'
                  }`}
                  style={{ minHeight: 44 }}
                  aria-label={`Pass ${question.pass} option: ${option}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </>
      )}
      {answered && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${correct ? 'text-mint' : 'text-coral'}`}>
          {correct ? <Check size={16} /> : null}
          {correct ? 'Correct' : `Answer: ${question.answer}`}
        </p>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AudioButton
          audioKey={`twopass-${activity.id}`}
          fallbackText={audio}
          label={plays === 0 ? 'Play the audio' : 'Play again'}
          onPlay={() => setPlays(p => p + 1)}
          disabled={outOfReplays}
        />
        <span className="tnum text-xs font-semibold text-muted">
          {plays === 0
            ? 'First, listen once for the gist.'
            : plays === 1
              ? q1Answered
                ? 'Play again — this time listen for the details.'
                : 'Answer pass 1, then listen again for details.'
              : `Replays used: ${replaysUsed} of ${replayAllowance}`}
        </span>
        {outOfReplays && !bothAnswered && (
          <span className="text-xs font-semibold text-coral">Replay allowance spent — answer from what you heard.</span>
        )}
      </div>

      <div className="space-y-4">
        {renderQuestion(q1, q1Selected, q1Answered, q1Correct, handleQ1, !canAnswerQ1, 'Pass 1', plays < 1)}
        {renderQuestion(q2, q2Selected, q2Answered, q2Correct, handleQ2, !canAnswerQ2, 'Pass 2', plays < 2)}
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          disabled={!bothAnswered}
          className="action-secondary text-sm disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: 44 }}
          aria-expanded={showTranscript}
        >
          {!bothAnswered ? 'Available after both questions' : showTranscript ? 'Hide the words' : 'Show the words'}
        </button>
      </div>

      {showTranscript && bothAnswered && (
        <div className="mt-3 rounded-xl border border-violet/20 bg-violet/5 p-4">
          <p className="eyebrow mb-2">Transcript</p>
          <p className="text-sm italic leading-6 text-ink">{audio}</p>
        </div>
      )}
    </div>
  );
}
