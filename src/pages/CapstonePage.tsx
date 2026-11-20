import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, MapPin, Play, Flag, Award, AlertTriangle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import {
  capstoneIslands, capstoneFinalGate, capstoneSkillLabels, CAPSTONE_STATION_COUNT,
  type CapstoneStation,
} from '../data/capstone';
import {
  getCurrentAttempt, coreBossesCompleted, islandStationsComplete,
  islandSealPassed, allSealsPassed, allStationsComplete, firstUnansweredGateIndex,
  firstIncompleteStation, setRetakeNoteSeen, CAPSTONE_XP,
} from '../lib/capstone';
import { PreviewSample } from '../components/capstone/PreviewSample';
import { SealGate } from '../components/capstone/SealGate';

/**
 * THE CAPSTONE MAP. Three islands x six skills = 18 stations — derived, not
 * chosen. Seals and the Final Gate sit OUTSIDE the 18: the seal is a modal
 * gate per island, and the Final Gate does not exist in the DOM until all
 * three seals are passed (Part K rule 10).
 */
export function CapstonePage() {
  const navigate = useNavigate();
  const { profile, progress } = useProgress();
  const [previewIsland, setPreviewIsland] = useState<string | null>(null);
  const [sealIsland, setSealIsland] = useState<string | null>(null);
  const [lockPanel, setLockPanel] = useState<{ unit: number; station: string } | null>(null);
  // Re-read on every render: seal and station writes from the modals must
  // show the moment they close, so the attempt is never memoized here.
  const [, setRefreshTick] = useState(0);
  const attempt = profile ? getCurrentAttempt(profile.name) : null;
  const bosses = useMemo(() => coreBossesCompleted(progress), [progress]);

  if (!profile || !attempt) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <p className="text-ink">Create your profile first.</p>
      </div>
    );
  }

  const sealsDone = allSealsPassed(attempt);
  const stationsDone = allStationsComplete(attempt);
  const gateUnlocked = sealsDone;
  const resume = firstIncompleteStation(attempt);
  const resumeGateIdx = gateUnlocked ? firstUnansweredGateIndex(attempt) : capstoneFinalGate.items.length;
  const gateStarted = attempt.finalGate.items.length > 0 && resumeGateIdx < capstoneFinalGate.items.length;
  const gateDone = attempt.outcome !== null;

  // Teacher's return note (Part J) — shown once, on the learner's next visit.
  const note = attempt.retakeNote;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-5">
        <p className="eyebrow mb-1">The Final Challenge</p>
        <h1 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">
          Three islands. Eighteen stations. One Final Gate.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {CAPSTONE_STATION_COUNT} review stations across three islands — one per skill, in course
          order. Each island closes with a Seal, and after all three Seals the Final Gate decides
          the certificate. One island per session; take the break.
        </p>
      </div>

      {note && (
        <div className="mb-4 rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm leading-6 text-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-sun" aria-hidden />
            <span>
              <strong>Your teacher returned this attempt for a retake.</strong>
              {note}
            </span>
          </p>
          <button
            onClick={() => { setRetakeNoteSeen(profile.name); }}
            className="action-secondary mt-3 text-sm"
            style={{ minHeight: 44 }}
          >
            Got it
          </button>
        </div>
      )}

      {!bosses.done && (
        <div className="mb-5 rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-ink">
            The Final Challenge opens when all nine unit Bosses are complete.
          </p>
          <p className="mt-1 text-sm text-muted">
            Still to go: Unit {bosses.missing[0]}
            {bosses.missing.length > 1 ? ` (+${bosses.missing.length - 1} more)` : ''}.
          </p>
        </div>
      )}

      {/* Resume line */}
      {bosses.done && resume && (
        <button
          onClick={() => navigate(`/capstone/station/${resume.islandId}/${resume.stationId}`)}
          className="action-primary mb-5 w-full"
          style={{ minHeight: 48 }}
        >
          <Play size={18} /> Continue where you left off
        </button>
      )}

      {/* Islands — Part B: the capstone locks as a WHOLE until all nine core
          bosses are done. Every locked station's reason is the next unit the
          learner needs (globally first missing), never a bare padlock. */}
      {capstoneIslands.map(island => {
        const lockUnit = bosses.done ? null : bosses.missing[0];
        const locked = !bosses.done;
        const stationsComplete = islandStationsComplete(island.id, attempt);
        const sealPassed = islandSealPassed(island.id, attempt);
        return (
          <section key={island.id} className="surface-card mb-5 p-5 sm:p-6">
            <div className="mb-1 flex items-center gap-2">
              <MapPin size={16} className="text-brand" aria-hidden />
              <h2 className="font-heading text-lg font-extrabold text-ink">
                Review Island {island.number} — {island.title}
              </h2>
            </div>
            <p className="mb-1 text-sm text-muted">{island.subtitle}</p>
            <p className="mb-4 text-xs font-semibold text-muted">
              Units {island.units.join(', ')} · {island.unitTitles.join(' · ')}
            </p>

            <div className="space-y-2">
              {island.stations.map(station => (
                <StationRow
                  key={station.id}
                  station={station}
                  locked={locked}
                  lockUnit={lockUnit}
                  done={attempt.stations[station.id] !== undefined}
                  onOpen={() => navigate(`/capstone/station/${island.id}/${station.id}`)}
                  onPreview={() => setPreviewIsland(island.id)}
                  onLockPanel={() => setLockPanel({ unit: lockUnit ?? 1, station: station.title })}
                />
              ))}
            </div>

            {/* THE SEAL — outside the 18, a gate not a station card */}
            <div className="mt-4 rounded-card border-2 border-dashed border-violet/40 bg-violet/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-violet">{island.seal.title}</p>
                  <p className="text-xs text-muted">
                    Six questions, one per skill. Pass with 4 to close the island.
                    {sealPassed ? ' Passed — its result does not feed the certificate.' : ' Not part of the 18 stations.'}
                  </p>
                </div>
                {sealPassed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-violet/10 px-3 py-1.5 text-xs font-extrabold text-violet">
                    <Award size={14} /> Seal earned
                  </span>
                ) : stationsComplete && !locked ? (
                  <button
                    onClick={() => setSealIsland(island.id)}
                    className="action-primary text-sm"
                    style={{ minHeight: 44 }}
                  >
                    Take the Seal
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-muted">
                    {locked
                      ? `Complete Unit ${lockUnit} to reach the Seal`
                      : 'Complete all six stations to reach the Seal'}
                  </p>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* THE FINAL GATE — rendered only when all three seals are passed */}
      {gateUnlocked && !gateDone && (
        <section className="mb-5 rounded-card border-2 border-brand bg-teal-50/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-brand">{capstoneFinalGate.title}</p>
              <p className="text-xs leading-5 text-muted">
                Twenty questions across all nine units, weighted like the course. No hints. This —
                and only this — decides the certificate.
              </p>
            </div>
            <button
              onClick={() => navigate('/capstone/final-gate')}
              className="action-primary text-sm"
              style={{ minHeight: 48 }}
            >
              <Flag size={16} /> {gateStarted ? `Resume: item ${resumeGateIdx + 1} of 20` : 'Enter the Final Gate'}
            </button>
          </div>
        </section>
      )}
      {gateUnlocked && gateDone && (
        <section className="mb-5 rounded-card border-2 border-brand bg-teal-50/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-brand">Final Gate complete</p>
              <p className="text-xs leading-5 text-muted">
                Outcome: {attempt.outcome === 'issued' ? 'Certificate issued' : attempt.outcome === 'pending' ? 'Waiting for your teacher' : 'Not issued yet — a retake is always open'}.
              </p>
            </div>
            <div className="flex gap-2">
              {attempt.outcome === 'issued' && (
                <button onClick={() => navigate('/capstone/certificate')} className="action-primary text-sm" style={{ minHeight: 44 }}>
                  <Award size={16} /> View certificate
                </button>
              )}
              <button onClick={() => navigate('/capstone/final-gate/results')} className="action-secondary text-sm" style={{ minHeight: 44 }}>
                See the results
              </button>
            </div>
          </div>
        </section>
      )}
      {!gateUnlocked && stationsDone && (
        <p className="mb-5 text-center text-sm font-semibold text-muted">
          Pass all three Seals to open the Final Gate.
        </p>
      )}

      {/* Preview + Seal + lock-reason modals */}
      {previewIsland && (
        <PreviewSample
          islandId={previewIsland}
          finishUnit={bosses.done ? null : bosses.missing[0]}
          onClose={() => { setPreviewIsland(null); setRefreshTick(t => t + 1); }}
        />
      )}
      {sealIsland && (
        <SealGate
          islandId={sealIsland}
          onClose={() => { setSealIsland(null); setRefreshTick(t => t + 1); }}
        />
      )}
      {lockPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setLockPanel(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Station locked"
            className="w-full max-w-[440px] rounded-card bg-white p-5 shadow-card sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-extrabold text-ink">
              <Lock size={16} className="text-muted" aria-hidden /> {lockPanel.station} is locked
            </h2>
            <p className="mb-4 text-sm leading-6 text-muted">
              Complete Unit {lockPanel.unit} to unlock this station.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/unit/${lockPanel.unit}/core`)}
                className="action-primary text-sm"
                style={{ minHeight: 44 }}
              >
                Go to Unit {lockPanel.unit}
              </button>
              <button
                onClick={() => setLockPanel(null)}
                className="action-secondary text-sm"
                style={{ minHeight: 44 }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StationRow({
  station, locked, lockUnit, done, onOpen, onPreview, onLockPanel,
}: {
  station: CapstoneStation;
  locked: boolean;
  lockUnit: number | null;
  done: boolean;
  onOpen: () => void;
  onPreview: () => void;
  onLockPanel: () => void;
}) {
  const isPreviewStation = station.skill === 'vocabulary';
  // Part B — a padlock never answers alone: locked Vocabulary stations open
  // the free preview; every other locked station opens a panel that names
  // the unit AND routes to it.
  const handleClick = () => {
    if (!locked) onOpen();
    else if (isPreviewStation) onPreview();
    else onLockPanel();
  };
  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-brand/40 hover:bg-teal-50/40"
      style={{ minHeight: 60 }}
      aria-label={locked ? `${station.title}. Locked: complete Unit ${lockUnit} to unlock this station.` : `${station.title}. ${done ? 'Completed' : 'Not yet done'}.`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          {done ? (
            <Check size={15} className="shrink-0 text-mint" aria-hidden />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-slate-300" aria-hidden />
          )}
          <span className="truncate text-sm font-bold text-ink">{station.title}</span>
          {locked && isPreviewStation && (
            <span className="rounded-md bg-violet/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-violet">Preview</span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {capstoneSkillLabels[station.skill] ?? station.skill} · {station.items.length} questions
          {locked && !isPreviewStation ? ` · Locked: complete Unit ${lockUnit} to unlock this station` : ''}
          {locked && isPreviewStation ? ' · Locked — tap to play the free preview' : ''}
        </span>
      </span>
      {locked ? (
        <Lock size={15} className="shrink-0 text-muted" aria-hidden />
      ) : (
        <span className="tnum shrink-0 text-xs font-bold text-muted">{CAPSTONE_XP.station} XP</span>
      )}
    </button>
  );
}
