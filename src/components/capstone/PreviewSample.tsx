import { useState } from 'react';
import { X } from 'lucide-react';
import { capstoneIsland } from '../../data/capstone';
import { CapstoneItemBody, RecordedPanel } from './CapstoneItem';

/**
 * Part B — PREVIEW MODE. One sample per island, always the Vocabulary
 * station, 3 items, labelled Preview, NOT scored and never written to
 * `h2eq.capstone.v1` (Part K rule 4). All state here is component state —
 * there is deliberately no store import to make "writes nothing" provable.
 */
export function PreviewSample({
  islandId, finishUnit, onClose,
}: {
  islandId: string;
  /** The unit the learner actually needs to finish — null when unlocked. */
  finishUnit: number | null;
  onClose: () => void;
}) {
  const island = capstoneIsland(islandId);
  const vocab = island?.stations.find(s => s.skill === 'vocabulary');
  const [index, setIndex] = useState(0);
  const [recorded, setRecorded] = useState(false);

  if (!island || !vocab) return null;

  const items = vocab.items.slice(0, 3);
  const item = items[index];
  const isLast = index === items.length - 1;

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={closeOnBackdrop}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${vocab.title} — preview`}
        className="max-h-[85vh] w-full max-w-[620px] overflow-y-auto rounded-card bg-white p-5 shadow-card sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-wide text-violet">Preview · not scored</p>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-slate-100"
            aria-label="Close preview"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <h2 className="mb-1 font-heading text-lg font-extrabold text-ink">{vocab.title}</h2>
        <p className="mb-4 text-sm text-muted">{vocab.prompt}</p>

        {!recorded ? (
          <>
            <p className="eyebrow mb-2 tnum">Sample item {index + 1} of {items.length}</p>
            <CapstoneItemBody
              key={item.id}
              item={item}
              onResult={() => setRecorded(true)}
            />
            <button
              onClick={() => setRecorded(true)}
              className="mt-3 text-sm text-muted underline hover:text-ink"
              style={{ minHeight: 44 }}
            >
              Move on
            </button>
          </>
        ) : isLast ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-ink">
              That was one small part. Finish Unit {finishUnit ?? island.units[0]} to unlock the rest.
            </p>
            <button onClick={onClose} className="action-primary mt-3 text-sm" style={{ minHeight: 44 }}>
              Close preview
            </button>
          </div>
        ) : (
          <RecordedPanel
            skipped={false}
            onNext={() => {
              setIndex(i => i + 1);
              setRecorded(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
