import { useState, useEffect } from 'react';
import type { Activity, RecordAndComparePayload } from '../../types';
import { AudioButton } from '../AudioButton';
import { Mic, MicOff, Play, Check, Star, AlertCircle, Volume2 } from 'lucide-react';
import { isSupported, listen, score } from '../../lib/speech';
import { useProgress } from '../../context/ProgressContext';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function RecordAndCompare({ activity, onResult }: Props) {
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
  const supported = isSupported();

  useEffect(() => {
    // Determine mode based on settings and support
    if (settings.noMicMode || !supported) {
      setMode('selfcheck');
    }
  }, [settings.noMicMode, supported]);

  const handleRecord = () => {
    if (!showPrivacyNotice) {
      setShowPrivacyNotice(true);
      return;
    }

    setRecording(true);
    setError(null);
    setTranscript('');
    setResult(null);

    const controller = listen(
      'en-US',
      (text) => {
        setTranscript(text);
        const r = score(text, payload.keywords);
        setResult(r);
        setRecording(false);

        const correct = r.stars >= 2;
        onResult(correct, {
          correctAnswer: payload.modelLine,
          rule: r.band,
        });
        if (correct) setCompleted(true);
      },
      (err) => {
        setRecording(false);
        if (err === 'not-allowed' || err === 'permission-denied') {
          setError('Microphone access was denied. You can use the self-check instead.');
          setMode('selfcheck');
        } else if (err === 'unsupported') {
          setError('Speech recognition is not supported in this browser. Use the self-check below.');
          setMode('selfcheck');
        } else {
          setError('Something went wrong with the recording. Try again or use the self-check.');
        }
      },
      () => {
        setRecording(false);
      },
    );

    // Store controller for potential cleanup
    return () => controller.stop();
  };

  const handleSelfCheckComplete = () => {
    const allChecked = selfCheck.saidAll && selfCheck.clear && selfCheck.smooth;
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.modelLine,
      rule: 'Self-check completed. You earn full XP for honest reflection.',
    });
  };

  const handleTeacherFallback = () => {
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.modelLine,
      rule: 'Say it to your teacher. You earn full XP for trying.',
    });
  };

  return (
    <div>
      {/* Model line */}
      <div className="mb-4 p-4 rounded-card bg-coral/10">
        <div className="flex items-center gap-3 mb-2">
          <AudioButton
            audioKey={`speak-model-${activity.id}`}
            fallbackText={payload.modelLine}
            rate={activity.difficulty === 'challenging' ? 1.0 : 0.9}
            label="Listen to model"
          />
        </div>
        <p className="text-sm text-ink italic">"{payload.modelLine}"</p>
      </div>

      {/* Privacy notice */}
      {showPrivacyNotice && mode === 'speech' && (
        <div className="mb-4 p-3 rounded-card bg-sun/10">
          <p className="text-sm text-ink">
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
              disabled={recording || completed}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-pill font-heading font-700 transition-colors ${
                recording
                  ? 'bg-coral text-white animate-pulse'
                  : 'bg-coral text-white hover:bg-coral/90'
              }`}
              style={{ minHeight: 44 }}
              aria-label={recording ? 'Recording... tap to stop' : 'Record yourself'}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
              {recording ? 'Listening...' : 'Record yourself'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-card bg-coral/10 flex items-start gap-2">
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
                    className={s <= result.stars ? 'text-sun fill-sun' : 'text-gray-200'}
                  />
                ))}
                <span className="text-sm font-medium text-ink ml-2">{result.band}</span>
              </div>

              {/* Transcript vs target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-card bg-cream border border-gray-100">
                  <p className="text-xs font-medium text-muted mb-1">What you said:</p>
                  <p className="text-sm text-ink">{result.transcript || '(nothing detected)'}</p>
                </div>
                <div className="p-3 rounded-card bg-coral/10">
                  <p className="text-xs font-medium text-muted mb-1">Target:</p>
                  <p className="text-sm text-ink">{payload.modelLine}</p>
                </div>
              </div>

              {/* Matched keywords */}
              {result.unmatchedKeywords.length > 0 && (
                <div className="p-3 rounded-card bg-sun/10">
                  <p className="text-xs font-medium text-muted mb-1">Words I heard:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map(k => (
                      <span key={k} className="text-xs px-2 py-1 rounded-pill bg-mint/20 text-mint font-medium">{k}</span>
                    ))}
                    {result.unmatchedKeywords.map(k => (
                      <span key={k} className="text-xs px-2 py-1 rounded-pill bg-gray-100 text-muted line-through">{k}</span>
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
                className="px-4 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink hover:bg-gray-50"
                style={{ minHeight: 44 }}
              >
                Try again
              </button>
              <button
                onClick={() => setMode('selfcheck')}
                className="px-4 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink hover:bg-gray-50"
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
          <div className="p-4 rounded-card bg-cream border border-gray-100">
            <p className="text-sm font-medium text-ink mb-3">Record yourself, then check each box:</p>
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-mint text-white font-heading font-700 hover:bg-mint/90 disabled:opacity-40"
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
        <div className="mt-4 p-3 rounded-card bg-mint/10">
          <p className="text-sm text-ink">Speaking task completed! Full XP earned.</p>
        </div>
      )}
    </div>
  );
}
