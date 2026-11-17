import { Compass } from 'lucide-react';

interface Props {
  /** The pack's missionBrief content string. */
  content: string;
  unitTitle: string;
  levelLabel: string;
  onContinue: () => void;
}

/**
 * MISSION_BRIEF — ritual layer. Shown once at level start, before station 1.
 * Content comes from pack.ritual.missionBrief.content; skippable but shown
 * by default.
 */
export function MissionBrief({ content, unitTitle, levelLabel, onContinue }: Props) {
  // "Big Question: <q> By the end you will be able to <goal>"
  const m = /^Big Question:\s*(.+?)\s*By the end you will be able to\s*(.+?)\.?\s*$/is.exec(content || '');
  const bigQuestion = m?.[1] ?? '';
  const goal = m?.[2] ?? content ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Mission brief"
    >
      <div className="surface-card w-full max-w-lg p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-brand">
            <Compass size={22} />
          </span>
          <div>
            <p className="eyebrow">Mission brief</p>
            <p className="text-sm font-bold text-ink">{unitTitle} · {levelLabel}</p>
          </div>
        </div>

        {bigQuestion && (
          <>
            <p className="eyebrow mb-1">Big Question</p>
            <h2 className="mb-4 font-heading text-xl font-extrabold leading-8 text-ink sm:text-2xl">
              “{bigQuestion}”
            </h2>
          </>
        )}

        <p className="mb-1 text-sm font-bold text-ink">By the end you will be able to:</p>
        <p className="mb-6 text-sm leading-6 text-muted">{goal}</p>

        <button onClick={onContinue} className="action-primary w-full" style={{ minHeight: 44 }}>
          Let's go
        </button>
      </div>
    </div>
  );
}
