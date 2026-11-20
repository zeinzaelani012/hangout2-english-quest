import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import {
  capstoneIsland, capstoneStation, adaptCapstoneItem, type CapstoneItem,
} from '../data/capstone';
import { recordStationResult, getCurrentAttempt, CAPSTONE_XP } from '../lib/capstone';
import { CapstoneItemBody, ShortResponse, RecordedPanel } from '../components/capstone/CapstoneItem';

interface AnsweredRecord {
  correct: boolean | null;
}

/**
 * ONE capstone station runner. Differences from a unit station, enforced
 * here (Part C): no teach card, no hint, no per-item answer reveal — the
 * mechanic unmounts the moment it reports, and the review step afterwards
 * is where the explanations appear. Items are interleaved across the
 * island's three units by the pack; the runner preserves pack order.
 * Skipping is allowed and recorded as unanswered.
 */
export function CapstoneStationPage() {
  const { islandId, stationId } = useParams();
  const navigate = useNavigate();
  const { profile, awardCapstoneXP } = useProgress();
  const island = capstoneIsland(islandId ?? '');
  const station = capstoneStation(islandId ?? '', stationId ?? '');

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnsweredRecord[]>([]);
  const [recorded, setRecorded] = useState<{ skipped: boolean; script?: string } | null>(null);
  const [review, setReview] = useState(false);

  const items = useMemo<CapstoneItem[]>(() => station?.items ?? [], [station]);

  if (!island || !station || !profile) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <p className="text-ink">Station not found.</p>
        <Link to="/capstone" className="text-brand hover:underline">Back to the Final Challenge</Link>
      </div>
    );
  }

  const item = items[index];
  const isReading = station.skill === 'reading';
  const isLast = index >= items.length - 1;

  const finishStation = (finalResults: AnsweredRecord[]) => {
    const answeredIdx = finalResults
      .map((r, i) => (r.correct !== null ? i : -1))
      .filter(i => i >= 0);
    const correct = finalResults.filter(r => r.correct === true).length;
    const attempt = getCurrentAttempt(profile.name);
    const firstTime = attempt.stations[station.id] === undefined;
    recordStationResult(profile.name, station.id, correct, items.length, answeredIdx);
    if (firstTime) awardCapstoneXP(CAPSTONE_XP.station);
    setReview(true);
  };

  const handleItemResult = (correct: boolean | null) => {
    const next = [...results, { correct }];
    setResults(next);
    if (item.type === 'audioToWord' || item.type === 'audioQuestion') {
      setRecorded({ skipped: correct === null, script: item.audio });
    } else {
      setRecorded({ skipped: correct === null });
    }
  };

  const handleNext = () => {
    setRecorded(null);
    if (isLast) {
      finishStation(results);
    } else {
      setIndex(i => i + 1);
    }
  };

  // ── Review step (Part C rule 2 — explanations live HERE) ──
  if (review) {
    const answered = results.filter(r => r.correct !== null).length;
    const correct = results.filter(r => r.correct === true).length;
    const pct = items.length > 0 ? Math.round((correct / items.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
        <div className="surface-card mb-4 p-5 sm:p-6">
          <p className="eyebrow mb-1">{island.title} · Review</p>
          <h1 className="mb-1 font-heading text-2xl font-extrabold text-ink">{station.title}</h1>
          <p className="mb-4 text-sm font-semibold text-muted">
            You answered {correct} of {items.length} correctly ({pct}%){answered < items.length ? ` — ${items.length - answered} moved on without answering.` : '.'}
          </p>
          <div className="space-y-3">
            {items.map((it, i) => {
              const r = results[i];
              const { item: clean } = adaptCapstoneItem(it, { forReview: true });
              return (
                <div
                  key={it.id}
                  className={`rounded-xl border p-4 ${
                    r?.correct === true ? 'border-emerald-200 bg-emerald-50' : r?.correct === false ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {r?.correct === true ? <Check size={16} className="mt-0.5 shrink-0 text-mint" /> : r?.correct === false ? <X size={16} className="mt-0.5 shrink-0 text-coral" /> : <span className="mt-0.5 text-xs font-bold text-muted">—</span>}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{clean.q ?? clean.sentence ?? clean.word ?? clean.img ?? clean.id}</p>
                      <p className="mt-1 text-sm text-ink">
                        <span className="font-semibold">Answer: </span>{it.answer}
                        {r && r.correct !== null && r.correct === false && <span className="text-muted"> — you answered differently</span>}
                        {r && r.correct === null && <span className="text-muted"> — you moved on without answering</span>}
                      </p>
                      {it.why && <p className="mt-1 text-sm leading-5 text-muted">{it.why}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            This station score is for feedback only — the certificate reads the Final Gate alone.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate(`/capstone?island=${island.id}`)}
              className="action-primary"
              style={{ minHeight: 44 }}
            >
              Back to the map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Item runner ──
  return (
    <div className="mx-auto max-w-[900px] px-4 py-4 sm:px-6 sm:py-6">
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:rounded-card sm:border sm:px-4 sm:shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => navigate('/capstone')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-slate-100"
              aria-label="Back to the Final Challenge map"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-extrabold text-ink">{island.title} · {station.title}</p>
              <p className="text-xs font-semibold text-muted">
                Item {index + 1} of {items.length} · {station.prompt}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-pill bg-brand transition-all duration-300" style={{ width: `${((index + (recorded ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="sr-only">{island.title} — {station.title}, item {index + 1}</h1>

      <div className="surface-card mb-4 p-5 sm:p-8">
        {recorded ? (
          <RecordedPanel
            skipped={recorded.skipped}
            showWordsScript={recorded.script}
            onNext={handleNext}
          />
        ) : item.type === 'shortResponse' ? (
          <ShortResponse item={item} onResult={handleItemResult} />
        ) : (
          <CapstoneItemBody
            key={item.id}
            item={item}
            passage={isReading ? station.passage : undefined}
            passageTitle={isReading ? station.title : undefined}
            onResult={handleItemResult}
          />
        )}
      </div>

      {/* Skipping is allowed and recorded — never blocked (Part C rule 4). */}
      {!recorded && (
        <button
          onClick={() => handleItemResult(null)}
          className="text-sm text-muted underline hover:text-ink"
          style={{ minHeight: 44 }}
        >
          Move on without answering
        </button>
      )}
    </div>
  );
}
