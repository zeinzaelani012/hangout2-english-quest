import { BookOpen } from 'lucide-react';

export interface TeachCardData {
  title: string;
  lines: string[];
  rule: string;
}

interface Props {
  card: TeachCardData;
  onContinue: () => void;
}

/**
 * TEACH_CARD — ritual layer. One screen at the start of the Vocabulary,
 * Grammar, Reading and Speaking stations, from the slot's teachCard
 * (title, lines[], rule). Tap to continue. If a station has no teachCard,
 * it is skipped silently.
 */
export function TeachCard({ card, onContinue }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Teach card"
    >
      <button
        onClick={onContinue}
        className="absolute inset-0 cursor-default"
        aria-label="Continue"
        tabIndex={-1}
      />
      <div className="surface-card relative w-full max-w-lg p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-brand">
            <BookOpen size={22} />
          </span>
          <p className="eyebrow">Teach card</p>
        </div>

        <h2 className="mb-4 font-heading text-xl font-extrabold text-ink sm:text-2xl">{card.title}</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {card.lines.map((line, i) => (
            <span
              key={i}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {line}
            </span>
          ))}
        </div>

        <p className="mb-6 rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold leading-6 text-ink">
          {card.rule}
        </p>

        <button onClick={onContinue} className="action-primary w-full" style={{ minHeight: 44 }}>
          Got it — let's start
        </button>
      </div>
    </div>
  );
}
