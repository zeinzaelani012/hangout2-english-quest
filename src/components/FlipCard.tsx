import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AudioButton } from './AudioButton';
import { VocabIllustration } from './Illustrations';
import type { VocabItem } from '../types';

interface FlipCardProps {
  item: VocabItem;
  introduced: boolean;
  reducedMotion: boolean;
  /** Fired the first time this card is flipped over. */
  onFirstFlip: () => void;
}

/**
 * Word Introduction flashcard. Front: word + illustration + pronunciation.
 * Back: example sentence + its audio. Tap anywhere to flip; audio buttons
 * stop propagation so they never trigger the flip.
 */
export function FlipCard({ item, introduced, reducedMotion, onFirstFlip }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const flip = () => {
    if (!flipped) onFirstFlip();
    setFlipped(f => !f);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${item.word} card. ${flipped ? 'Showing example. Press to flip back.' : 'Press to flip and see the example.'}`}
      onClick={flip}
      onKeyDown={handleKey}
      className="cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-card"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative min-h-[280px] rounded-card shadow-card transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionDuration: reducedMotion ? '0ms' : undefined,
        }}
      >
        {/* Front — word */}
        <div
          className="surface-card absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="rounded-pill border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted">
            {item.category}
          </span>
          <VocabIllustration imgHint={item.imgHint} size={96} />
          <p className="font-heading text-3xl font-extrabold text-ink">{item.word}</p>
          <div onClick={e => e.stopPropagation()}>
            <AudioButton audioKey={item.id} fallbackText={item.word} label="Say it" />
          </div>
          <p className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-muted">
            <RefreshCw size={12} /> Tap to flip
          </p>
        </div>

        {/* Back — example */}
        <div
          className="surface-card absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="eyebrow">Example</p>
          <p className="font-heading text-xl font-bold leading-8 text-ink">“{item.example}”</p>
          <div onClick={e => e.stopPropagation()}>
            <AudioButton audioKey={`${item.id}-example`} fallbackText={item.example} label="Hear it" />
          </div>
          <p className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-muted">
            <RefreshCw size={12} /> Tap to flip back
          </p>
        </div>
      </div>
      {introduced && !flipped && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-mint">✓ Introduced</p>
      )}
    </div>
  );
}
