import { useState, useEffect, useRef } from 'react';
import type { Activity, RecordAndComparePayload } from '../../types';
import { AudioButton } from '../AudioButton';
import { playUiSound, type AudioRole } from '../../lib/audio';
import { Mic, MicOff, Check, Star, AlertCircle } from 'lucide-react';
import { isSupported, listen, score } from '../../lib/speech';
import { useProgress } from '../../context/ProgressContext';
import type { ItemResult } from './v2-types';
import { SnackTableHero } from '../Illustrations';
import { getUnitReading } from '../../data/units';

export type SpeakingMode =
  | 'warmUpRepeat'
  | 'chunkDrill'
  | 'askAnswer'
  | 'pictureDescription'
  | 'rolePlay'
  | 'personalResponse'
  | 'monologue';

interface Props {
  activity: Activity;
  onResult: ItemResult;
  /** v2 speaking mode; absent for legacy Units 2/3 activities. */
  mode?: SpeakingMode;
}

// Safety net so a hung recognition session can never trap the learner
const MAX_RECORD_MS = 12000;

// D3: the standard three-item self-check shown after any recording exists
// (the pack can override it with payload.selfCheck).
const D3_SELF_CHECK = ['I said all the words', 'I said it clearly and loudly', 'I said it without long pauses'];

function LegacyRecordAndCompare({ activity, onResult }: Props) {
  const payload = activity.payload as RecordAndComparePayload;
  const { settings } = useProgress();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ReturnType<typeof score> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [selfCheck, setSelfCheck] = useState({ saidAll: false, clear: false, smooth: false });
  const [mode, setMode] = useState<'speech' | 'selfcheck' | 'teacher'>('speech');
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const controllerRef = useRef<{ stop: () => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supported = isSupported();

  useEffect(() => {
    // Determine mode based on settings and support — every state keeps full XP earnable
    if (settings.noMicMode) {
      setMode('selfcheck');
      setFallbackReason('No-mic mode is on in Settings, so this task uses self-check. You can still earn full XP.');
    } else if (!supported) {
      setMode('selfcheck');
      setFallbackReason('Speech recognition is not available in this browser, so this task uses self-check. You can still earn full XP.');
    }
    return () => {
      controllerRef.current?.stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [settings.noMicMode, supported]);

  const stopRecording = () => {
    controllerRef.current?.stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRecording(false);
  };

  const startListening = () => {
    setRecording(true);
    setError(null);
    setTranscript('');
    setResult(null);

    controllerRef.current = listen(
      'en-US',
      (text) => {
        setTranscript(text);
        const r = score(text, payload.keywords);
        setResult(r);
        setRecording(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const correct = r.stars >= 2;
        playUiSound(correct ? 'correct' : 'retry');
        onResult(correct, {
          correctAnswer: payload.modelLine,
          rule: r.band,
        });
        if (correct) setCompleted(true);
      },
      (err) => {
        setRecording(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (err === 'not-allowed' || err === 'permission-denied' || err === 'service-not-allowed') {
          setFallbackReason('Microphone access was denied, so this task uses self-check instead. You can still earn full XP.');
          setMode('selfcheck');
        } else if (err === 'no-speech') {
          setError("I didn't hear anything. Speak a little louder and try again, or use the self-check below.");
        } else if (err === 'unsupported') {
          setFallbackReason('Speech recognition is not supported here, so this task uses self-check. You can still earn full XP.');
          setMode('selfcheck');
        } else {
          setError('Something went wrong with the recording. Try again, or use the self-check below.');
        }
      },
      () => {
        setRecording(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      },
    );

    timeoutRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
  };

  const handleRecord = () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (!showPrivacyNotice) {
      setShowPrivacyNotice(true);
      return;
    }
    startListening();
  };

  const handleSelfCheckComplete = () => {
    playUiSound('next');
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.modelLine,
      rule: 'Self-check completed. You earn full XP for honest reflection.',
    });
  };

  const handleTeacherFallback = () => {
    playUiSound('next');
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.modelLine,
      rule: 'Say it to your teacher. You earn full XP for trying.',
    });
  };

  return (
    <div>
      {/* Target + recognised transcript side by side */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="mb-2 flex items-center gap-3">
            <AudioButton
              audioKey={`speak-model-${activity.id}`}
              fallbackText={payload.modelLine}
              rate={activity.difficulty === 'challenging' ? 1.0 : 0.9}
              label="Listen to model"
            />
          </div>
          <p className="eyebrow mb-1">Target</p>
          <p className="text-sm font-semibold italic leading-6 text-ink">"{payload.modelLine}"</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
          <p className="eyebrow mb-1">What you said</p>
          <p className="min-h-[1.25rem] text-sm leading-6 text-ink">
            {transcript || <span className="text-muted">Press "Record yourself" and say the sentence.</span>}
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      {showPrivacyNotice && mode === 'speech' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-6 text-ink">
            Your browser may send your voice to its own speech service. Nothing is stored by this app.
          </p>
        </div>
      )}

      {/* Speech recognition mode */}
      {mode === 'speech' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleRecord}
              disabled={completed}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-6 py-3 font-heading font-bold text-white transition-colors ${
                recording
                  ? 'animate-pulse bg-coral'
                  : 'bg-coral hover:bg-red-600'
              } disabled:opacity-40`}
              style={{ minHeight: 44 }}
              aria-label={recording ? 'Recording... tap to stop' : 'Record yourself'}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
              {recording ? 'Listening... tap to stop' : 'Record yourself'}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="text-coral shrink-0 mt-0.5" />
              <p className="text-sm text-ink">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mb-4 space-y-3">
              {/* Stars */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    size={24}
                    className={s <= result.stars ? 'fill-sun text-sun' : 'text-slate-200'}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-ink">{result.band}</span>
              </div>

              {/* Matched keywords */}
              {result.unmatchedKeywords.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="eyebrow mb-2">Words I heard</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map(k => (
                      <span key={k} className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-mint">{k}</span>
                    ))}
                    {result.unmatchedKeywords.map(k => (
                      <span key={k} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-muted line-through">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Try again / self-check fallback */}
          {!completed && (result || error) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setResult(null); setTranscript(''); setError(null); }}
                className="action-secondary text-sm"
                style={{ minHeight: 44 }}
              >
                Try again
              </button>
              <button
                onClick={() => setMode('selfcheck')}
                className="action-secondary text-sm"
                style={{ minHeight: 44 }}
              >
                Use self-check instead
              </button>
            </div>
          )}
        </>
      )}

      {/* Self-check mode */}
      {mode === 'selfcheck' && (
        <div className="space-y-4">
          {fallbackReason && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-sun" />
              <p className="text-sm leading-6 text-ink">{fallbackReason}</p>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-bold text-ink">Record yourself, then check each box:</p>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={selfCheck.saidAll}
                  onChange={e => setSelfCheck(prev => ({ ...prev, saidAll: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm text-ink">I said every word</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={selfCheck.clear}
                  onChange={e => setSelfCheck(prev => ({ ...prev, clear: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm text-ink">I was clear</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={selfCheck.smooth}
                  onChange={e => setSelfCheck(prev => ({ ...prev, smooth: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm text-ink">I was smooth</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSelfCheckComplete}
            disabled={completed}
            className="action-primary bg-mint hover:bg-emerald-700"
            style={{ minHeight: 44 }}
          >
            <Check size={18} /> Complete
          </button>

          {/* Teacher fallback */}
          <div className="pt-2">
            <button
              onClick={handleTeacherFallback}
              className="text-sm text-muted hover:text-ink underline"
            >
              No microphone? Say it to your teacher instead.
            </button>
          </div>
        </div>
      )}

      {completed && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-ink">Speaking task completed. Full XP earned.</p>
        </div>
      )}
    </div>
  );
}

// ---- v2 SPEAKING (seven modes) ------------------------------------------------
// One recorder, seven modes. CRITICAL: the model answer is never visible
// before the recording; after recording it is shown beside the transcript.

interface V2Target {
  label?: string;
  model?: string;
  keywords: string[];
  speaker?: string;
}

function SpeakingV2({ activity, onResult, mode }: Props & { mode: SpeakingMode }) {
  const payload = activity.payload as Record<string, any>;
  const { settings } = useProgress();
  const supported = isSupported();

  const selfCheckItems: string[] =
    (payload.selfCheck ?? []).length > 0 ? payload.selfCheck : D3_SELF_CHECK;

  const [flowMode, setFlowMode] = useState<'speech' | 'selfcheck'>(
    settings.noMicMode || !supported ? 'selfcheck' : 'speech',
  );
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // Per-item recorder state
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ReturnType<typeof score> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sequence state
  const [index, setIndex] = useState(0);
  const [itemDone, setItemDone] = useState(false);
  const [reps, setReps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [attemptDone, setAttemptDone] = useState(false);
  // Checklists initialise from their items so first-item boxes are wired up
  const [ticks, setTicks] = useState<boolean[]>((payload.prompts ?? []).map(() => false));
  const [selfChecks, setSelfChecks] = useState<boolean[]>(selfCheckItems.map(() => false));

  const controllerRef = useRef<{ stop: () => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build the target list per mode
  let targets: V2Target[] = [];
  if (mode === 'warmUpRepeat' || mode === 'chunkDrill' || mode === 'askAnswer' || mode === 'personalResponse') {
    targets = (payload.items ?? []).map((i: any) => ({
      label: i.chunk ?? i.q,
      model: i.model,
      keywords: i.keywords ?? [],
    }));
  } else if (mode === 'rolePlay') {
    // Role-play source is per-unit; the shared builder stamps unitId on every
    // activity so Unit 2's S5 reads The Sweatshirt, not Unit 1's dialogue.
    const dialogue = getUnitReading(activity.unitId ?? 1).dialogue;
    const lineCount: number = payload.lines ?? dialogue.lines.length;
    targets = dialogue.lines.slice(0, lineCount).map(l => ({
      label: l.text,
      speaker: l.speaker,
      keywords: payload.keywords ?? [],
    }));
    if (payload.extra) {
      targets.push({ label: payload.extra, keywords: payload.keywords ?? [] });
    }
  } else {
    // pictureDescription and monologue are single-target
    targets = [{ keywords: payload.keywords ?? [] }];
  }

  const target = targets[index];
  const isLast = index >= targets.length - 1;
  const minimumSeconds: number | undefined = payload.minimumSeconds;
  const maxRecordMs =
    mode === 'monologue' || mode === 'pictureDescription'
      ? Math.max(MAX_RECORD_MS, ((minimumSeconds ?? 20) + 15) * 1000)
      : MAX_RECORD_MS;
  // Long-form speech keeps listening across natural pauses
  const isContinuous = mode === 'monologue' || mode === 'pictureDescription';

  // Monologue count-up timer (never counts down)
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  useEffect(() => () => {
    controllerRef.current?.stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const finishActivity = () => {
    onResult(true, {
      correctAnswer: targets[0]?.model ?? targets[0]?.label ?? activity.prompt,
      rule: result?.band ?? 'Speaking task completed. Full XP earned.',
    });
  };

  const completeItem = () => {
    playUiSound('next');
    setItemDone(true);
    if (isLast) finishActivity();
  };

  const startListening = () => {
    setRecording(true);
    setError(null);
    if (mode === 'monologue') {
      setElapsed(0);
      setTimerRunning(true);
    }

    let finishedAttempt = false;
    let acc = '';

    controllerRef.current = listen(
      'en-US',
      (text) => {
        if (isContinuous) {
          // Long-form speech: accumulate the transcript, finish on end.
          acc = acc ? `${acc} ${text}` : text;
          setTranscript(acc);
          return;
        }
        setTranscript(text);
        const r = score(text, target?.keywords ?? []);
        setResult(r);
        setRecording(false);
        setTimerRunning(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (mode === 'chunkDrill') {
          const next = reps + 1;
          setReps(next);
          if (next >= 3) setAttemptDone(true);
        } else {
          // D3: the model, transcript and self-check appear; completion is
          // gated on the self-check below, never on a percentage.
          setAttemptDone(true);
        }
      },
      (err) => {
        setRecording(false);
        setTimerRunning(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (err === 'not-allowed' || err === 'permission-denied' || err === 'service-not-allowed' || err === 'unsupported') {
          setFallbackReason('Microphone unavailable, so this task uses self-check. You can still earn full XP.');
          setFlowMode('selfcheck');
        } else if (err === 'no-speech') {
          setError("I didn't hear anything. Speak a little louder and try again.");
        } else {
          setError('Something went wrong with the recording. Try again.');
        }
      },
      () => {
        setRecording(false);
        setTimerRunning(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (isContinuous && !finishedAttempt) {
          finishedAttempt = true;
          const r = score(acc, target?.keywords ?? []);
          setResult(r);
          // D3: completion is gated on the post-attempt self-check below.
          setAttemptDone(true);
        }
      },
      isContinuous,
    );

    timeoutRef.current = setTimeout(() => {
      controllerRef.current?.stop();
      setRecording(false);
      setTimerRunning(false);
    }, maxRecordMs);
  };

  const handleRecord = () => {
    if (recording) {
      controllerRef.current?.stop();
      setRecording(false);
      setTimerRunning(false);
      return;
    }
    // A retake resets the post-attempt self-check
    if (attemptDone) {
      setAttemptDone(false);
      setSelfChecks(selfCheckItems.map(() => false));
    }
    if (!showPrivacyNotice) {
      setShowPrivacyNotice(true);
      return;
    }
    setTranscript('');
    setResult(null);
    startListening();
  };

  const handleNext = () => {
    setIndex(i => i + 1);
    setItemDone(false);
    setAttemptDone(false);
    setTranscript('');
    setResult(null);
    setError(null);
    setReps(0);
    setElapsed(0);
    setTicks((payload.prompts ?? []).map(() => false));
    setSelfChecks(selfCheckItems.map(() => false));
  };

  // Teacher fallback completes the current turn; the teacher clicks through
  // the remaining turns with each student.
  const handleTeacherFallback = () => {
    setItemDone(true);
    if (isLast) finishActivity();
  };

  const unitLabel =
    mode === 'warmUpRepeat' ? `Line ${index + 1} of ${targets.length}`
    : mode === 'chunkDrill' ? `Chunk ${index + 1} of ${targets.length}`
    : mode === 'askAnswer' || mode === 'personalResponse' ? `Question ${index + 1} of ${targets.length}`
    : mode === 'rolePlay' ? `Turn ${index + 1} of ${targets.length}`
    : undefined;

  // Self-check fallback labels never quote the model — the model stays
  // withheld until after the attempt in every flow.
  const fallbackSelfCheck: string[] =
    mode === 'monologue'
      ? selfCheckItems
      : mode === 'chunkDrill'
        ? ['I said the chunk three times, clear and fast']
        : mode === 'warmUpRepeat'
          ? ['I said the line out loud before hearing the model']
          : mode === 'rolePlay'
            ? ['I said my line in character, loud and clear']
            : ['I said my answer out loud, clearly and in full'];

  if (!target) return null;

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div>
      {unitLabel && <p className="eyebrow mb-3 tnum">{unitLabel}</p>}

      {/* Mode-specific target surfaces */}
      {mode === 'warmUpRepeat' && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
          Say the line first — the model plays after you record.
        </p>
      )}

      {mode === 'chunkDrill' && target.label && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-heading text-lg font-extrabold text-ink">{target.label}</p>
          <p className="mt-2 text-sm font-bold text-muted tnum">
            Repetition {Math.min(reps + (itemDone ? 0 : 1), 3)} of 3 — say it fast, then faster.
          </p>
        </div>
      )}

      {(mode === 'askAnswer' || mode === 'personalResponse') && target.label && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold leading-7 text-ink">
          {target.label}
        </p>
      )}

      {mode === 'pictureDescription' && (
        <div className="mb-4">
          <div className="mb-3 flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
            <SnackTableHero className="h-auto w-full max-w-xs" />
          </div>
          <p className="eyebrow mb-2">Cover each point</p>
          <div className="space-y-1.5">
            {(payload.prompts ?? []).map((prompt: string, i: number) => (
              <button
                key={i}
                onClick={() => setTicks(prev => prev.map((t, idx) => (idx === i ? !t : t)))}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  ticks[i] ? 'border-emerald-300 bg-emerald-50 text-ink' : 'border-slate-200 bg-white text-ink hover:bg-slate-50'
                }`}
                aria-pressed={ticks[i]}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${ticks[i] ? 'border-mint bg-mint text-white' : 'border-slate-300'}`}>
                  {ticks[i] && <Check size={13} />}
                </span>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'rolePlay' && (
        <div className="mb-4 space-y-1.5">
          {targets.map((t, i) => {
            // D3: withhold the learner's line (and upcoming lines) until a
            // recording exists for the current turn
            const revealed = i < index || (i === index && attemptDone);
            const isCurrent = i === index;
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm leading-6 ${
                  isCurrent
                    ? 'border-brand/40 bg-teal-50 font-semibold text-ink'
                    : i < index
                      ? 'border-slate-200 bg-white text-muted'
                      : 'border-slate-200 bg-white text-ink'
                }`}
              >
                <span className="min-w-0">
                  {t.speaker && <span className="font-bold text-violet">{t.speaker}: </span>}
                  {revealed
                    ? t.label
                    : isCurrent
                      ? <span className="font-normal italic text-muted">Listen to your line, then record — it appears here afterwards.</span>
                      : <span className="text-muted">…</span>}
                </span>
                {/* Phase 8: revealed lines replay in the character's voice */}
                {revealed && t.label && (
                  <AudioButton
                    audioKey={`rp-${activity.id}-${i}`}
                    fallbackText={t.label}
                    role={roleForSpeaker(t.speaker)}
                    level={activity.difficulty}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      {mode === 'rolePlay' && !itemDone && (
        <div className="mb-4">
          <AudioButton
            audioKey={`speak-${activity.id}-${index}`}
            fallbackText={target.label ?? ''}
            rate={0.9}
            label="Hear your line"
          />
        </div>
      )}

      {mode === 'monologue' && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="eyebrow">Keep talking</p>
            <p className="tnum font-heading text-lg font-extrabold text-ink">{mmss}</p>
          </div>
          {minimumSeconds !== undefined && (
            <p className="mb-3 text-xs font-semibold text-muted">Aim for at least {minimumSeconds} seconds — the timer counts up.</p>
          )}
          <p className="eyebrow mb-2">Scaffold</p>
          <ul className="space-y-1">
            {(payload.scaffold ?? []).map((line: string, i: number) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink">{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript + model (model only AFTER recording) */}
      {flowMode === 'speech' && (
        <>
          {transcript && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
                <p className="eyebrow mb-1">What you said</p>
                <p className="text-sm leading-6 text-ink">{transcript}</p>
              </div>
              {attemptDone && target.model && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="eyebrow mb-1">Model</p>
                  {/* Part G model gating: the model — text AND its play control —
                      exists only once a recording does. */}
                  <p className="mb-2 text-sm font-semibold leading-6 text-ink">{target.model}</p>
                  <AudioButton
                    audioKey={`model-${activity.id}-${index}`}
                    fallbackText={target.model}
                    level={activity.difficulty}
                    label="Play the model"
                  />
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[1, 2, 3].map(s => (
                <Star key={s} size={22} className={s <= result.stars ? 'fill-sun text-sun' : 'text-slate-200'} />
              ))}
              <span className="text-sm font-semibold text-ink">{result.band}</span>
            </div>
          )}

          {/* D3: once a recording exists — transcript | model above, then the
              three-item self-check. Completion is gated on it, never on a
              percentage. */}
          {attemptDone && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-ink">Check your speaking:</p>
              <div className="space-y-2.5">
                {selfCheckItems.map((line: string, i: number) => (
                  <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selfChecks[i] ?? false}
                      onChange={e => setSelfChecks(prev => prev.map((c, idx) => (idx === i ? e.target.checked : c)))}
                      className="h-5 w-5 rounded border-slate-300 text-brand"
                    />
                    <span className="text-sm font-semibold text-ink">{line}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={completeItem}
                disabled={!(selfChecks.length > 0 && selfChecks.every(Boolean))}
                className="action-primary mt-3 bg-mint hover:bg-emerald-700"
              >
                <Check size={18} /> Complete
              </button>
            </div>
          )}

          {showPrivacyNotice && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-ink">
                Your browser may send your voice to its own speech service. Nothing is stored by this app.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-coral" />
              <p className="text-sm leading-6 text-ink">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecord}
              disabled={itemDone}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-6 py-3 font-heading font-bold text-white transition-colors ${
                recording ? 'animate-pulse bg-coral' : 'bg-coral hover:bg-red-600'
              } disabled:opacity-40`}
              style={{ minHeight: 44 }}
              aria-label={recording ? 'Recording... tap to stop' : 'Record yourself'}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
              {recording ? 'Listening... tap to stop' : 'Record yourself'}
            </button>
            {itemDone && !isLast && (
              <button onClick={handleNext} className="action-primary">
                Next
              </button>
            )}
          </div>

          <div className="pt-2">
            <button onClick={() => setFlowMode('selfcheck')} className="text-sm text-muted underline hover:text-ink">
              No microphone? Use self-check instead.
            </button>
          </div>
        </>
      )}

      {/* Self-check fallback flow */}
      {flowMode === 'selfcheck' && (
        <div className="space-y-4">
          {fallbackReason && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-sun" />
              <p className="text-sm leading-6 text-ink">{fallbackReason}</p>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-bold text-ink">
              {mode === 'monologue' ? 'After you speak, check each box:' : 'Say it out loud, then check the box:'}
            </p>
            <div className="space-y-2.5">
              {fallbackSelfCheck.map((line: string, i: number) => (
                <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mode === 'monologue' ? selfChecks[i] ?? false : itemDone}
                    onChange={e =>
                      mode === 'monologue'
                        ? setSelfChecks(prev => prev.map((c, idx) => (idx === i ? e.target.checked : c)))
                        : setItemDone(e.target.checked)
                    }
                    className="h-5 w-5 rounded border-slate-300 text-brand"
                  />
                  <span className="text-sm font-semibold text-ink">{line}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={completeItem}
              disabled={
                mode === 'monologue'
                  ? !(selfChecks.length > 0 && selfChecks.every(Boolean))
                  : !itemDone
              }
              className="action-primary bg-mint hover:bg-emerald-700"
            >
              <Check size={18} /> Complete
            </button>
            {itemDone && !isLast && (
              <button onClick={handleNext} className="action-secondary">
                Next
              </button>
            )}
          </div>
          <div className="pt-2">
            <button onClick={handleTeacherFallback} className="text-sm text-muted underline hover:text-ink">
              No microphone? Say it to your teacher instead.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecordAndCompare(props: Props) {
  if (props.mode) {
    return <SpeakingV2 {...props} mode={props.mode} />;
  }
  return <LegacyRecordAndCompare {...props} />;
}

// Same rule the manifest script uses: a speaker name that is one of the six
// roles speaks as that character; anything else is the narrator.
const KNOWN_ROLES = new Set(['ana', 'ben', 'brian', 'mia', 'lina']);

function roleForSpeaker(speaker: string | undefined): AudioRole {
  const n = String(speaker ?? '').trim().toLowerCase();
  return (KNOWN_ROLES.has(n) ? n : 'narrator') as AudioRole;
}

