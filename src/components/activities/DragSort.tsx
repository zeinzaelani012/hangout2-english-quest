import { useRef, useState } from 'react';
import type { Activity, DragSortPayload } from '../../types';
import { VocabIllustration } from '../Illustrations';
import { Check, X, ArrowRight } from 'lucide-react';
import type { ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

// ---- v2 SORT_BINS -------------------------------------------------------------
// types: dragSort, grouping. The pack's bins are plain strings and its items
// are { word, bin, why? }; they are normalised into the component's shape.

function isV2Sort(payload: any): boolean {
  return (
    Array.isArray(payload?.bins) &&
    typeof payload.bins[0] === 'string' &&
    Array.isArray(payload?.items) &&
    typeof payload.items[0]?.bin === 'string'
  );
}

function normalizeV2Sort(activity: Activity): Activity {
  const raw = activity.payload as Record<string, any>;
  const normalized: DragSortPayload = {
    prompt: raw.prompt ?? activity.prompt,
    bins: (raw.bins as string[]).map((label, i) => ({ id: label, label, imgHint: '' })),
    items: (raw.items as { word: string; bin: string; why?: string }[]).map((it, i) => ({
      id: it.word,
      label: it.word,
      binId: it.bin,
      imgHint: it.word,
      why: it.why,
    } as any)),
    hint: '',
    why: '',
  };
  return { ...activity, payload: { ...normalized, v2: true } as any };
}

function SortBinsBody({ activity, onResult }: Props) {
  const payload = activity.payload as DragSortPayload & { v2?: boolean; items: { why?: string }[] };
  const [items, setItems] = useState(
    payload.items.map(item => ({ ...item, placedBin: null as string | null }))
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedBin, setFocusedBin] = useState(0);
  const [checked, setChecked] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const unplacedItems = items.filter(i => !i.placedBin);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, binId: string) => {
    e.preventDefault();
    if (!draggedId || checked) return;
    setItems(prev => prev.map(i =>
      i.id === draggedId ? { ...i, placedBin: binId } : i
    ));
    setDraggedId(null);
  };

  // Keyboard alternative: select an item (click / Enter), then arrows move the
  // bin focus and Space drops the selected item into the focused bin.
  const handleItemKeySelect = (itemId: string, fromKeyboard = false) => {
    if (checked) return;
    setSelectedId(itemId);
    if (fromKeyboard) {
      // Move focus straight to the bins grid so arrows/space work immediately.
      requestAnimationFrame(() => gridRef.current?.focus());
    }
  };

  const handleBinKeySelect = (binId: string) => {
    if (!selectedId || checked) return;
    setItems(prev => prev.map(i =>
      i.id === selectedId ? { ...i, placedBin: binId } : i
    ));
    setSelectedId(null);
  };

  const removeFromBin = (itemId: string) => {
    if (checked) return;
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, placedBin: null } : i
    ));
  };

  const handleCheck = () => {
    setChecked(true);
    const allCorrect = items.every(i => i.placedBin === i.binId);
    const incorrectCount = items.filter(i => i.placedBin !== i.binId).length;
    onResult(allCorrect || incorrectCount < items.length / 2, {
      correctAnswer: items.map(i => `${i.label} → ${payload.bins.find(b => b.id === i.binId)?.label}`).join('; '),
      rule: payload.why || 'Sort each item into the box where it belongs.',
    });
  };

  const handleSortKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedId || checked) return;
    const binCount = payload.bins.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBin(prev => (prev + 1) % binCount);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBin(prev => (prev - 1 + binCount) % binCount);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleBinKeySelect(payload.bins[focusedBin].id);
    }
  };

  return (
    <div>
      {/* Bins */}
      <div
        ref={gridRef}
        className={`mb-6 grid gap-4 ${
          payload.bins.length === 2
            ? 'grid-cols-2'
            : payload.bins.length === 4
              ? 'grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-3'
        }`}
        tabIndex={selectedId ? 0 : -1}
        onKeyDown={handleSortKeyDown}
        aria-label="Sort bins. Select an item, then use arrow keys and space to drop."
      >
        {payload.bins.map((bin, binIdx) => {
          const binItems = items.filter(i => i.placedBin === bin.id);
          const isFocused = selectedId !== null && focusedBin === binIdx;
          return (
            <div
              key={bin.id}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, bin.id)}
              onClick={() => selectedId && handleBinKeySelect(bin.id)}
              className={`min-h-[160px] rounded-xl border-2 border-dashed p-4 transition-colors ${
                isFocused
                  ? 'border-brand bg-teal-50/60 ring-2 ring-brand/30'
                  : selectedId
                    ? 'cursor-pointer border-brand/50 bg-teal-50/30 hover:bg-teal-50'
                    : 'border-slate-200 bg-slate-50'
              }`}
              role="button"
              tabIndex={0}
              aria-label={`${bin.label} bin. ${binItems.length} items placed.`}
              onKeyDown={e => {
                if (e.key === 'Enter' && selectedId) {
                  e.stopPropagation();
                  handleBinKeySelect(bin.id);
                }
              }}
            >
              <p className="mb-3 text-center font-heading text-sm font-bold text-ink">{bin.label}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {binItems.map(item => (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                      checked
                        ? item.placedBin === item.binId
                          ? 'border-emerald-200 bg-emerald-50 text-mint'
                          : 'border-red-200 bg-red-50 text-coral'
                        : 'border-slate-200 bg-white text-ink'
                    }`}
                  >
                    {activity.difficulty !== 'challenging' && item.imgHint && (
                      <VocabIllustration imgHint={item.imgHint} size={24} />
                    )}
                    {item.label}
                    {!checked && (
                      <button
                        onClick={e => { e.stopPropagation(); removeFromBin(item.id); }}
                        className="ml-1 text-muted hover:text-coral"
                        aria-label={`Remove ${item.label}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {checked && item.placedBin === item.binId && <Check size={14} />}
                    {checked && item.placedBin !== item.binId && (
                      <span className="text-xs">
                        <ArrowRight size={12} className="inline" />
                        {payload.bins.find(b => b.id === item.binId)?.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unplaced items */}
      {unplacedItems.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted">
            Drag items to a bin — or select an item, then use the arrow keys and space to drop.
          </p>
          <div className="flex flex-wrap gap-2">
            {unplacedItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item.id)}
                onClick={() => handleItemKeySelect(item.id)}
                className={`draggable-item flex cursor-grab items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  selectedId === item.id
                    ? 'border-brand bg-teal-50 text-brand ring-2 ring-brand/20'
                    : 'border-slate-200 bg-white text-ink hover:border-brand/40'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${item.label}. ${selectedId === item.id ? 'Selected. Now choose a bin.' : 'Click to select, then choose a bin.'}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemKeySelect(item.id, true);
                  }
                }}
              >
                {activity.difficulty !== 'challenging' && item.imgHint && (
                  <VocabIllustration imgHint={item.imgHint} size={24} />
                )}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check button */}
      {unplacedItems.length === 0 && !checked && (
        <button
          onClick={handleCheck}
          className="action-primary w-full"
          style={{ minHeight: 44 }}
        >
          Check answers
        </button>
      )}

      {checked && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
          <p className="text-sm font-semibold leading-6 text-ink">
            {items.every(i => i.placedBin === i.binId)
              ? 'All correct! Great job!'
              : `${items.filter(i => i.placedBin === i.binId).length} of ${items.length} correct.`}
          </p>
          {payload.why && (
            <p className="mt-1 text-xs leading-5 text-muted">{payload.why}</p>
          )}
          {items.some(i => i.placedBin !== i.binId && (i as any).why) && (
            <ul className="mt-2 space-y-1">
              {items.filter(i => i.placedBin !== i.binId && (i as any).why).map(i => (
                <li key={i.id} className="text-xs leading-5 text-muted">
                  <span className="font-bold text-ink">{i.label}:</span> {(i as any).why}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Legacy drag sort (Units 2/3) ----------------------------------------------

function LegacyDragSort({ activity, onResult }: Props) {
  const payload = activity.payload as DragSortPayload;
  // Legacy payloads are structurally identical to the v2-normalised shape —
  // reuse the same body by wrapping the activity.
  const wrapped: Activity = { ...activity, payload: { ...payload, items: payload.items as any } };
  return <SortBinsBody activity={wrapped} onResult={onResult} />;
}

export function DragSort(props: Props) {
  const raw = props.activity.payload as Record<string, any>;
  if (isV2Sort(raw)) {
    return <SortBinsBody activity={normalizeV2Sort(props.activity)} onResult={props.onResult} />;
  }
  return <LegacyDragSort {...props} />;
}
