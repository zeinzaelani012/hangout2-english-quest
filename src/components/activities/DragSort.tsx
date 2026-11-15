import { useState, useRef } from 'react';
import type { Activity, DragSortPayload } from '../../types';
import { VocabIllustration } from '../Illustrations';
import { Check, X, ArrowRight } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function DragSort({ activity, onResult }: Props) {
  const payload = activity.payload as DragSortPayload;
  const [items, setItems] = useState(
    payload.items.map(item => ({ ...item, placedBin: null as string | null }))
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const dragOriginRef = useRef<string | null>(null);

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
    if (!draggedId) return;
    setItems(prev => prev.map(i =>
      i.id === draggedId ? { ...i, placedBin: binId } : i
    ));
    setDraggedId(null);
  };

  // Keyboard alternative: select item, then select a bin
  const handleItemKeySelect = (itemId: string) => {
    setSelectedId(itemId);
  };

  const handleBinKeySelect = (binId: string) => {
    if (!selectedId) return;
    setItems(prev => prev.map(i =>
      i.id === selectedId ? { ...i, placedBin: binId } : i
    ));
    setSelectedId(null);
  };

  const removeFromBin = (itemId: string) => {
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
      rule: payload.why,
    });
  };

  return (
    <div>
      {/* Bins */}
      <div className={`grid gap-4 mb-6 ${payload.bins.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {payload.bins.map(bin => {
          const binItems = items.filter(i => i.placedBin === bin.id);
          return (
            <div
              key={bin.id}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, bin.id)}
              onClick={() => selectedId && handleBinKeySelect(bin.id)}
              className={`rounded-card p-4 min-h-[160px] border-2 border-dashed transition-colors ${
                selectedId
                  ? 'border-brand cursor-pointer hover:bg-brand/5'
                  : 'border-gray-200 bg-cream'
              }`}
              role="button"
              tabIndex={0}
              aria-label={`${bin.label} bin. ${binItems.length} items placed.`}
              onKeyDown={e => e.key === 'Enter' && selectedId && handleBinKeySelect(bin.id)}
            >
              <p className="font-heading font-700 text-sm text-ink mb-3 text-center">{bin.label}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {binItems.map(item => (
                  <div
                    key={item.id}
                    className={`relative rounded-pill px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium ${
                      checked
                        ? item.placedBin === item.binId
                          ? 'bg-mint/15 text-mint'
                          : 'bg-coral/15 text-coral'
                        : 'bg-white shadow-card text-ink'
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
          <p className="text-sm text-muted mb-3">Drag these items to the right bin, or select an item then tap a bin:</p>
          <div className="flex flex-wrap gap-2">
            {unplacedItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item.id)}
                onClick={() => handleItemKeySelect(item.id)}
                className={`draggable-item rounded-pill px-4 py-2 flex items-center gap-2 text-sm font-medium cursor-grab transition-all ${
                  selectedId === item.id
                    ? 'bg-brand/10 ring-2 ring-brand text-brand'
                    : 'bg-white shadow-card text-ink hover:shadow-cardhover'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${item.label}. ${selectedId === item.id ? 'Selected. Now choose a bin.' : 'Click to select, then choose a bin.'}`}
                onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? handleItemKeySelect(item.id) : null}
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
          className="w-full py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors"
          style={{ minHeight: 44 }}
        >
          Check answers
        </button>
      )}

      {checked && (
        <div className="mt-4 p-3 rounded-card bg-mint/10" aria-live="polite">
          <p className="text-sm text-ink">
            {items.every(i => i.placedBin === i.binId)
              ? 'All correct! Great job!'
              : `${items.filter(i => i.placedBin === i.binId).length} of ${items.length} correct. ${payload.why}`}
          </p>
        </div>
      )}
    </div>
  );
}
