import { useState } from 'react';
import type { Activity, StickerPlatePayload } from '../../types';
import { VocabIllustration } from '../Illustrations';
import { AudioButton } from '../AudioButton';
import { Check, X } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function StickerPlate({ activity, onResult }: Props) {
  const payload = activity.payload as StickerPlatePayload;
  const [placed, setPlaced] = useState<{ id: string; label: string; imgHint: string }[]>([]);
  const [completed, setCompleted] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const available = payload.stickers.filter(s => !placed.find(p => p.id === s.id));

  const handleAdd = (sticker: { id: string; label: string; imgHint: string }) => {
    if (placed.find(p => p.id === sticker.id)) return;
    setPlaced(prev => [...prev, sticker]);
  };

  const handleRemove = (id: string) => {
    setPlaced(prev => prev.filter(p => p.id !== id));
  };

  const handleComplete = () => {
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.speakingPrompt,
      rule: 'Great! Now say your sentence out loud.',
    });
  };

  return (
    <div>
      {/* Plate area */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain');
          const sticker = payload.stickers.find(s => s.id === id);
          if (sticker) handleAdd(sticker);
        }}
        className="relative mb-4 flex min-h-[200px] flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-dashed border-coral/25 bg-orange-50/40 p-6"
        aria-label={payload.prompt}
        role="region"
      >
        {/* Plate SVG */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-5" aria-hidden="true">
          <ellipse cx="100" cy="100" rx="90" ry="70" fill="#F05A47" />
        </svg>

        {placed.length === 0 && (
          <p className="text-sm text-muted relative z-10">{payload.prompt}</p>
        )}

        {placed.map(item => (
          <div
            key={item.id}
            className="relative flex flex-col items-center gap-1 z-10"
          >
            <button
              onClick={() => handleRemove(item.id)}
              className="relative"
              aria-label={`${item.label} placed. Click to remove.`}
            >
              <VocabIllustration imgHint={item.imgHint} size={56} />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral text-white flex items-center justify-center">
                <X size={12} />
              </span>
            </button>
            <span className="text-xs font-medium text-ink">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Available stickers */}
      {available.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Sticker options</p>
          <div className="flex flex-wrap gap-2">
            {available.map(sticker => (
              <button
                key={sticker.id}
                draggable
                onDragStart={e => {
                  setDraggedId(sticker.id);
                  e.dataTransfer.setData('text/plain', sticker.id);
                }}
                onClick={() => handleAdd(sticker)}
                className="draggable-item flex min-h-11 cursor-grab flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-2.5 transition-all hover:border-brand/40 hover:bg-teal-50/40"
                style={{ minHeight: 44 }}
                aria-label={`${sticker.label} sticker. Drag or click to add.`}
              >
                <VocabIllustration imgHint={sticker.imgHint} size={40} />
                <span className="text-xs font-medium text-ink">{sticker.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Speaking prompt */}
      {placed.length >= 3 && !completed && (
        <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <AudioButton
              audioKey={`sticker-prompt-${activity.id}`}
              fallbackText={payload.speakingPrompt}
              label="Hear the prompt"
            />
          </div>
          <p className="text-sm text-ink">{payload.speakingPrompt}</p>
        </div>
      )}

      {/* Complete button */}
      {placed.length >= 3 && !completed && (
        <button
          onClick={handleComplete}
          className="action-primary w-full bg-mint hover:bg-emerald-700"
          style={{ minHeight: 44 }}
        >
          I said my sentence!
        </button>
      )}

      {completed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Check size={18} className="text-mint" />
            Great! You said your sentence like a pro.
          </p>
        </div>
      )}
    </div>
  );
}
