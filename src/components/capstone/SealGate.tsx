import { useState } from 'react';
import { Award, X } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { capstoneIsland } from '../../data/capstone';
import { recordSealResult, islandSealPassed, getCurrentAttempt, CAPSTONE_XP } from '../../lib/capstone';
import { CapstoneItemBody, RecordedPanel } from './CapstoneItem';

/**
 * Part D — THE SEAL. One per island, after its six stations: a modal gate,
 * not a station card. Six items, exactly one per skill in course order.
 * Pass mark 4 of 6; below that an immediate retake is offered WITHOUT
 * replaying the six stations. Unanswered counts as incorrect. The result is
 * recorded but never feeds the certificate — the UI says so in one line.
 */
export function SealGate({ islandId, onClose }: { islandId: string; onClose: () => void }) {
  const { profile, awardCapstoneXP } = useProgress();
  const island = capstoneIsland(islandId);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<boolean | null>>([]);
  const [recorded, setRecorded] = useState<{ skipped: boolean; script?: string } | null>(null);
  const [outcome, setOutcome] = useState<{ passed: boolean; correct: number } | null>(null);

  if (!island || !profile) return null;
  const seal = island.seal;
  const readingStation = island.stations.find(s => s.skill === 'reading');

  const handleResult = (correct: boolean | null) => {
    const next = [...results, correct];
    setResults(next);
    const item = seal.items[index];
    setRecorded({
      skipped: correct === null,
      script: item.type === 'audioToWord' || item.type === 'audioQuestion' ? item.audio : undefined,
    });
  };

  const finish = (finalResults: Array<boolean | null>) => {
    const correct = finalResults.filter(r => r === true).length;
    const passed = correct >= seal.passMark;
    // XP only the FIRST time this seal passes — a retake that passes again
    // pays nothing (Part F retry rule). Read the pre-record state.
    const attemptBefore = getCurrentAttempt(profile.name);
    const alreadyPassed = islandSealPassed(islandId, attemptBefore);
    recordSealResult(profile.name, seal.id, correct, seal.of);
    if (passed && !alreadyPassed) awardCapstoneXP(CAPSTONE_XP.seal);
    setOutcome({ passed, correct });
  };

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={closeOnBackdrop}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={seal.title}
        className="max-h-[88vh] w-full max-w-[680px] overflow-y-auto rounded-card bg-white p-5 shadow-card sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-violet">
            <Award size={13} aria-hidden /> Island Seal
          </p>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-slate-100"
            aria-label="Close seal gate"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {outcome ? (
          outcome.passed ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet/10">
                <Award size={26} className="text-violet" aria-hidden />
              </div>
              <h2 className="mb-1 font-heading text-xl font-extrabold text-ink">{seal.title} — earned</h2>
              <p className="mb-1 text-sm font-semibold text-muted">
                {outcome.correct} of {seal.of} correct.
              </p>
              <p className="mb-4 text-xs leading-5 text-muted">
                The Seal closes this island. Its result is recorded but does not feed the
                certificate — the Final Gate does.
              </p>
              <button onClick={onClose} className="action-primary text-sm" style={{ minHeight: 44 }}>
                Back to the map
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="mb-1 font-heading text-xl font-extrabold text-ink">Not through yet</h2>
              <p className="mb-1 text-sm font-semibold text-muted">
                {outcome.correct} of {seal.of} — you need {seal.passMark} to pass.
              </p>
              <p className="mb-4 text-xs leading-5 text-muted">
                Take the Seal again right away — you do not go back through the six stations.
              </p>
              <button
                onClick={() => {
                  setResults([]);
                  setIndex(0);
                  setRecorded(null);
                  setOutcome(null);
                }}
                className="action-primary text-sm"
                style={{ minHeight: 44 }}
              >
                Retake the Seal
              </button>
              <div className="pt-3">
                <button onClick={onClose} className="text-sm text-muted underline hover:text-ink" style={{ minHeight: 44 }}>
                  Come back later
                </button>
              </div>
            </div>
          )
        ) : (
          <>
            <h2 className="mb-1 font-heading text-lg font-extrabold text-ink">{seal.title}</h2>
            <p className="mb-4 text-sm text-muted">{seal.prompt}</p>
            <p className="eyebrow mb-2 tnum">Question {index + 1} of {seal.of}</p>
            {!recorded ? (
              <>
                <CapstoneItemBody
                  key={seal.items[index].id}
                  item={seal.items[index]}
                  passage={seal.items[index].skill === 'reading' ? readingStation?.passage : undefined}
                  passageTitle={seal.items[index].skill === 'reading' ? readingStation?.title : undefined}
                  onResult={handleResult}
                />
                <button
                  onClick={() => handleResult(null)}
                  className="mt-3 text-sm text-muted underline hover:text-ink"
                  style={{ minHeight: 44 }}
                >
                  Move on without answering
                </button>
              </>
            ) : (
              <RecordedPanel
                skipped={recorded.skipped}
                showWordsScript={recorded.script}
                onNext={() => {
                  if (index < seal.of - 1) {
                    setIndex(i => i + 1);
                    setRecorded(null);
                  } else {
                    finish(results);
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
