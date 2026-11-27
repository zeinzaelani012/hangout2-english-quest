import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, RotateCcw, Send } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import {
  capstoneFinalGate, capstoneIsland, capstoneSkillLabels, orderedFinalGateItems, type CapstoneItem,
} from '../data/capstone';
import {
  getCurrentAttempt, allSealsPassed, recordGateAnswer, finalizeAttempt, firstUnansweredGateIndex,
  bandFor, verificationCode, setCertificateId, CAPSTONE_XP, startRetake, SKILLS,
} from '../lib/capstone';
import { CapstoneItemBody, ShortResponse, RecordedPanel } from '../components/capstone/CapstoneItem';
import { Certificate } from '../components/capstone/Certificate';
import { playUiSound } from '../lib/audio';
import type { SelfAssessmentRecord, Skill } from '../types';

/**
 * THE FINAL GATE (Part E) — twenty items across all nine units, speaking
 * last, no timer, no hints. This is where the course stops being practice:
 * distinct background, no station chrome, "Item 7 of 20". Items are
 * recorded one at a time so a half-finished gate resumes at the first
 * unanswered item (Part I) — answered items are never discarded and never
 * re-shown.
 */
export function FinalGatePage() {
  const navigate = useNavigate();
  const { profile, awardCapstoneXP } = useProgress();
  const items = useMemo<CapstoneItem[]>(() => orderedFinalGateItems(), []);
  const attempt = useMemo(() => (profile ? getCurrentAttempt(profile.name) : null), [profile]);
  const [index, setIndex] = useState(() => (attempt ? firstUnansweredGateIndex(attempt) : 0));
  const [recorded, setRecorded] = useState<{ skipped: boolean; script?: string } | null>(null);

  const allAnswered = attempt ? index >= items.length : false;

  // A learner who answers the last item but closes before "Next" (or whose
  // answers were all recorded by a resumed session) still gets finalized.
  useEffect(() => {
    if (!profile || !allAnswered) return;
    const current = getCurrentAttempt(profile.name);
    if (current.outcome !== null) return;
    finalizeAttempt(profile.name);
    awardCapstoneXP(CAPSTONE_XP.gate);
    navigate('/capstone/final-gate/results');
  }, [allAnswered, profile, navigate, awardCapstoneXP]);

  if (!profile || !attempt) return null;
  // Part K rule 10 — the gate does not exist before all three seals pass.
  if (!allSealsPassed(attempt)) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <p className="text-ink">The Final Gate opens after all three Seals.</p>
        <Link to="/capstone" className="text-brand hover:underline">Back to the Final Challenge</Link>
      </div>
    );
  }

  // Everything answered: the effect above finalizes and routes — show a quiet
  // placeholder so this render can never touch a missing item.
  if (allAnswered) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Finishing the Final Gate">
        <div className="h-8 w-8 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
      </div>
    );
  }

  const item = items[index];
  const isLast = index >= items.length - 1;
  // Reading items quote one of the island passages — show it above the item.
  const gatePassage = item.skill === 'reading' ? passageForUnit(item.unit ?? 0) : undefined;

  const handleResult = (correct: boolean | null) => {
    playUiSound(correct === null ? 'next' : correct ? 'correct' : 'retry');
    recordGateAnswer(profile.name, item.id, item.skill as Skill, correct === true);
    setRecorded({
      skipped: correct === null,
      script: item.type === 'audioToWord' || item.type === 'audioQuestion' ? item.audio : undefined,
    });
  };

  const handleNext = () => {
    setRecorded(null);
    if (isLast) {
      playUiSound('complete');
      finalizeAttempt(profile.name);
      awardCapstoneXP(CAPSTONE_XP.gate);
      navigate('/capstone/final-gate/results');
    } else {
      playUiSound('next');
      setIndex(i => i + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 to-brand">
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => navigate('/capstone')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10"
              aria-label="Leave the Final Gate — your answers are kept"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-extrabold">{capstoneFinalGate.title}</p>
              <p className="text-xs font-semibold text-white/70">{capstoneFinalGate.prompt}</p>
            </div>
          </div>
          <span className="tnum shrink-0 rounded-pill bg-white/10 px-3 py-1.5 text-xs font-extrabold">
            Item {index + 1} of {items.length}
          </span>
        </div>

        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-pill bg-white transition-all duration-300" style={{ width: `${((index + (recorded ? 1 : 0)) / items.length) * 100}%` }} />
        </div>

        <div className="rounded-card bg-white p-5 shadow-card sm:p-8">
          <p className="eyebrow mb-2">{capstoneSkillLabels[item.skill ?? 'vocabulary'] ?? item.skill}</p>
          {recorded ? (
            <RecordedPanel skipped={recorded.skipped} showWordsScript={recorded.script} onNext={handleNext} />
          ) : item.type === 'shortResponse' ? (
            <ShortResponse item={item} onResult={handleResult} />
          ) : (
            <CapstoneItemBody
              key={item.id}
              item={item}
              passage={gatePassage}
              passageTitle={gatePassage ? 'The reading text' : undefined}
              onResult={handleResult}
            />
          )}
        </div>

        {!recorded && (
          <button
            onClick={() => handleResult(null)}
            className="mt-4 text-sm font-semibold text-white/70 underline hover:text-white"
            style={{ minHeight: 44 }}
          >
            Move on without answering
          </button>
        )}
        <p className="mt-4 text-center text-xs text-white/60">
          Leaving never loses your answers — you resume right here.
        </p>
      </div>
    </div>
  );
}

/** Reading items quote their island's passage: units 1-3, 4-6, 7-9. */
function passageForUnit(unit: number): string | undefined {
  const islandId = unit <= 3 ? 'review1' : unit <= 6 ? 'review2' : 'review3';
  const reading = capstoneIsland(islandId)?.stations.find(s => s.skill === 'reading');
  return reading?.passage;
}

// ── Results + certificate decision screen (Part G) ───────────────────────────

export function FinalGateResultsPage() {
  const navigate = useNavigate();
  const { profile, progress, settings } = useProgress();
  const attempt = useMemo(() => (profile ? getCurrentAttempt(profile.name) : null), [profile]);
  const [verification, setVerification] = useState<string | null>(null);

  // Deterministic code — same learner + date + overall → same code. Also
  // stamps it on the attempt so Teacher Mode and the map can show the id.
  useEffect(() => {
    if (attempt?.outcome === 'issued' && attempt.issuedAt && attempt.overall !== null) {
      const learner = profile?.name ?? '';
      verificationCode(learner, attempt.issuedAt, attempt.overall).then(code => {
        setVerification(code);
        if (!attempt.certificateId) setCertificateId(learner, code);
      });
    }
  }, [attempt?.outcome, attempt?.issuedAt, attempt?.overall, profile?.name]);

  if (!profile || !attempt) return null;

  if (attempt.outcome === null || attempt.overall === null || !attempt.skillScores) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <p className="text-ink">The Final Gate is not finished yet.</p>
        <Link to="/capstone/final-gate" className="text-brand hover:underline">Resume the Final Gate</Link>
      </div>
    );
  }

  const scores = attempt.skillScores;
  const weakest = [...SKILLS].sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0)).slice(0, 2);

  // Part H item 7 — the FINAL self-check (most recent completed record).
  const selfCheck = latestSelfCheck(progress.selfAssessments ?? {});
  const selfCheckLine = selfCheck ? buildSelfCheckLine(selfCheck, scores) : null;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      {attempt.outcome === 'issued' && (
        <>
          <div className="mb-5 text-center">
            <p className="eyebrow mb-1">The Final Gate</p>
            <h1 className="font-heading text-2xl font-extrabold text-ink">Your certificate is ready</h1>
            <button
              onClick={() => window.print()}
              className="action-primary mt-3 text-sm"
              style={{ minHeight: 44 }}
            >
              <Printer size={16} /> Print / save as PDF
            </button>
          </div>
          <Certificate
            learnerName={profile.name}
            schoolName={settings.schoolName ?? 'Hangout 2 — English Quest'}
            issuedAt={attempt.issuedAt ?? Date.now()}
            skillScores={scores}
            selfCheckLine={selfCheckLine}
            verification={verification ?? '—————'}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => navigate('/capstone')} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Back to the map
            </button>
            {/* Part I — retakes are unlimited, even after an issue. The issued
                attempt is archived immutable; a retake can only add, never
                downgrade. */}
            <button onClick={() => { startRetake(profile.name); navigate('/capstone/final-gate'); }} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              <RotateCcw size={16} /> Retake anyway
            </button>
          </div>
        </>
      )}

      {attempt.outcome === 'pending' && (
        <div className="surface-card p-5 sm:p-6">
          <p className="eyebrow mb-1">The Final Gate</p>
          <h1 className="mb-2 font-heading text-2xl font-extrabold text-ink">Almost there</h1>
          <p className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
            <Send size={16} className="text-brand" aria-hidden /> Your results have been sent to your teacher.
          </p>
          <p className="mb-4 text-sm leading-6 text-muted">
            Your teacher can release the certificate — or return this attempt with advice. Either
            way, you can also take the Final Gate again at any time.
          </p>
          <SkillProfile scores={scores} />
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => { startRetake(profile.name); navigate('/capstone/final-gate'); }} className="action-primary text-sm" style={{ minHeight: 44 }}>
              <RotateCcw size={16} /> Retake the Final Gate
            </button>
            <button onClick={() => navigate('/capstone')} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Back to the map
            </button>
          </div>
        </div>
      )}

      {attempt.outcome === 'not_issued' && (
        <div className="surface-card p-5 sm:p-6">
          <p className="eyebrow mb-1">The Final Gate</p>
          <h1 className="mb-2 font-heading text-2xl font-extrabold text-ink">Your skill profile</h1>
          <p className="mb-4 text-sm leading-6 text-muted">
            Not this time — and that is information, not a failure. Your two strongest growth
            areas are <strong>{capstoneSkillLabels[weakest[0]]}</strong> and{' '}
            <strong>{capstoneSkillLabels[weakest[1]]}</strong>. The Final Gate is always open for
            a retake.
          </p>
          <SkillProfile scores={scores} />
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => { startRetake(profile.name); navigate('/capstone/final-gate'); }} className="action-primary text-sm" style={{ minHeight: 44 }}>
              <RotateCcw size={16} /> Retake the Final Gate
            </button>
            <button onClick={() => navigate('/capstone')} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Back to the map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillProfile({ scores }: { scores: Record<Skill, number> }) {
  return (
    <div className="space-y-2.5">
      {SKILLS.map(skill => (
        <div key={skill} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs font-bold text-muted">{capstoneSkillLabels[skill]}</span>
          <div className="h-3 flex-1 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-brand" style={{ width: `${Math.max(3, scores[skill] ?? 0)}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-extrabold text-ink">{bandFor(scores[skill] ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

function latestSelfCheck(records: Record<string, SelfAssessmentRecord>): SelfAssessmentRecord | null {
  const all = Object.values(records).filter(r => !r.skipped);
  if (all.length === 0) return null;
  return all.sort((a, b) => b.completedAt - a.completedAt)[0];
}

const RATING_LABEL: Record<number, string> = { 1: 'Not yet', 2: 'Almost', 3: 'Yes' };

function buildSelfCheckLine(record: SelfAssessmentRecord, scores: Record<Skill, number>): string | null {
  const skill = record.hardest ?? (Object.keys(record.ratings)[0] as Skill | undefined);
  if (!skill) return null;
  const rating = record.ratings[skill];
  if (rating === undefined) return null;
  return `On their final self-check they rated ${capstoneSkillLabels[skill]} '${RATING_LABEL[rating]}'; their work showed '${bandFor(scores[skill] ?? 0)}'.`;
}
