import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { units, getUnitReading } from '../data/units';
import { LEVEL_LABELS, SKILL_LABELS, SKILL_COLORS, type Activity, type Level } from '../types';
import { VocabIllustration } from '../components/Illustrations';
import { AudioButton } from '../components/AudioButton';
import type { Level as LevelKey } from '../types';

const PRESENT_LEVELS: Level[] = ['easy', 'core', 'challenging'];
const PRESENT_ZOOM = 1.4;

/**
 * Classroom Present mode: one activity per screen at 1.4x scale.
 * No XP, no persistence — nothing the teacher does here is saved.
 * Number keys 1–5 reveal answer options one at a time.
 */
export function PresentMode() {
  const navigate = useNavigate();
  const playable = units.filter(u => u.status === 'playable');

  const [unitId, setUnitId] = useState(playable[0]?.id ?? 1);
  const [levelKey, setLevelKey] = useState<Level>('core');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);

  const unit = units.find(u => u.id === unitId);
  const activities = unit?.levels[levelKey] ?? [];
  const current: Activity | undefined = activities[index];
  const station = current ? unit?.stations.find(s => s.skill === current.skill) : undefined;
  const readings = useMemo(() => getUnitReading(unitId), [unitId]);

  const reset = () => { setIndex(0); setRevealed([]); };

  const payload = current?.payload as Record<string, any> | undefined;
  const options: { id: string; label: string; imgHint?: string }[] | null =
    current?.type === 'pictureMatch'
      ? payload?.options ?? null
      : current?.type === 'gapFill'
        ? (payload?.options ?? []).map((o: string, i: number) => ({ id: String(i), label: o }))
        : null;
  const answerLabel =
    current?.type === 'pictureMatch'
      ? payload?.options?.find((o: any) => o.id === payload?.answerId)?.label
      : current?.type === 'gapFill'
        ? payload?.answer
        : null;

  const goNext = () => {
    setRevealed([]);
    setIndex(i => Math.min(i + 1, activities.length - 1));
  };
  const goPrev = () => {
    setRevealed([]);
    setIndex(i => Math.max(i - 1, 0));
  };

  // Keyboard: 1–5 reveals options, arrows navigate, Escape exits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5' && options) {
        const n = parseInt(e.key, 10) - 1;
        if (n < options.length) {
          setRevealed(prev => (prev.includes(n) ? prev : [...prev, n]));
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goPrev();
      } else if (e.key === 'Escape') {
        navigate('/teacher');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, activities.length, navigate]);

  if (!unit || unit.status !== 'playable') {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-800 text-2xl text-ink mb-4">Present mode</h1>
        <p className="text-muted">This unit is not available for presenting.</p>
        <button onClick={() => navigate('/teacher')} className="text-brand hover:underline mt-4">
          Back to Teacher Mode
        </button>
      </div>
    );
  }

  const skillColor = current ? SKILL_COLORS[current.skill] : '#2B3A8F';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <span className="font-heading font-800 text-lg text-brand">Present mode</span>
          <span className="text-xs text-muted">No XP · nothing is saved</span>
          <span className="flex-1" />
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">Unit</span>
            <select
              value={unitId}
              onChange={e => { setUnitId(parseInt(e.target.value, 10)); reset(); }}
              className="px-3 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink"
            >
              {playable.map(u => (
                <option key={u.id} value={u.id}>Unit {u.id}: {u.title}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">Level</span>
            <select
              value={levelKey}
              onChange={e => { setLevelKey(e.target.value as LevelKey); reset(); }}
              className="px-3 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink"
            >
              {PRESENT_LEVELS.map(l => (
                <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => navigate('/teacher')}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-ink"
            aria-label="Exit Present mode"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Activity at 1.4x */}
      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-6">
        {current && (
          <div style={{ zoom: PRESENT_ZOOM }}>
            <div className="bg-white rounded-card shadow-card p-8 sm:p-10 mb-4">
              {/* Station + counter */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs px-2.5 py-1 rounded-pill font-medium"
                  style={{ backgroundColor: `${skillColor}15`, color: skillColor }}
                >
                  {station?.name || SKILL_LABELS[current.skill]}
                </span>
                <span className="text-xs text-muted tnum">{index + 1} of {activities.length}</span>
              </div>

              <h1 className="font-heading font-800 text-2xl text-ink mb-6">{current.prompt}</h1>

              {/* Reading text for reading activities */}
              {current.skill === 'reading' && current.type === 'gapFill' && (
                <ReadingPanel texts={readings.readingTexts} level={levelKey} activity={current} />
              )}

              {/* Audio script for listening activities */}
              {current.skill === 'listening' && (
                <ListeningPanel script={payload?.audioScript || ''} />
              )}

              <PresentationBody
                activity={current}
                options={options}
                revealed={revealed}
                answerLabel={answerLabel}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer with large Next */}
      <footer className="sticky bottom-0 z-20 bg-cream/95 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-pill bg-white shadow-card font-heading font-700 text-ink hover:bg-gray-50 disabled:opacity-40"
            style={{ minHeight: 56, fontSize: '1.05rem' }}
            aria-label="Previous activity"
          >
            <ChevronLeft size={22} /> Back
          </button>
          <span className="flex-1" />
          <span className="text-sm text-muted tnum hidden sm:block">
            Tip: keys 1–5 reveal options · arrows navigate · Esc exits
          </span>
          <button
            onClick={goNext}
            disabled={index >= activities.length - 1}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-pill bg-brand text-white font-heading font-800 hover:bg-brand/90 disabled:opacity-40"
            style={{ minHeight: 56, fontSize: '1.25rem' }}
            aria-label="Next activity"
          >
            Next <ChevronRight size={26} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function PresentationBody({
  activity,
  options,
  revealed,
  answerLabel,
}: {
  activity: Activity;
  options: { id: string; label: string; imgHint?: string }[] | null;
  revealed: number[];
  answerLabel: string | null;
}) {
  const payload = activity.payload as Record<string, any>;

  if (options) {
    const isGrid = activity.type === 'pictureMatch';
    return (
      <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
        {options.map((option, idx) => {
          const isRevealed = revealed.includes(idx);
          const isAnswer = answerLabel !== null && option.label === answerLabel;
          return (
            <div
              key={option.id}
              className={`rounded-card p-5 flex items-center gap-4 transition-all ${
                isRevealed
                  ? isAnswer
                    ? 'bg-mint/10 ring-2 ring-mint'
                    : 'bg-cream ring-1 ring-gray-200'
                  : 'bg-cream border-2 border-dashed border-gray-200'
              }`}
              style={{ minHeight: 72 }}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-800 text-lg shrink-0 ${
                isRevealed ? 'bg-brand text-white' : 'bg-gray-100 text-muted'
              }`}>
                {idx + 1}
              </span>
              {isRevealed ? (
                <>
                  {activity.type === 'pictureMatch' && option.imgHint && (
                    <VocabIllustration imgHint={option.imgHint} size={64} />
                  )}
                  <span className="font-heading font-700 text-xl text-ink flex-1">{option.label}</span>
                  {isAnswer && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-mint text-white text-sm font-heading font-700">
                      <Check size={16} /> Answer
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg text-muted flex-1">Press {idx + 1} to reveal</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  switch (activity.type) {
    case 'dragSort':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {payload.bins.map((bin: any) => (
              <div key={bin.id} className="rounded-card p-5 bg-cream border-2 border-dashed border-brand/30">
                <p className="font-heading font-700 text-lg text-ink">{bin.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {payload.items.map((item: any) => (
              <span key={item.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-white shadow-card text-ink font-medium">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      );
    case 'sentenceBuilder':
      return (
        <div className="flex flex-wrap gap-3">
          {payload.scrambled.map((tile: string, i: number) => (
            <span key={i} className="px-5 py-3 rounded-card bg-cream shadow-card text-xl font-heading font-700 text-ink">
              {tile}
            </span>
          ))}
        </div>
      );
    case 'stickerPlate':
      return (
        <div className="space-y-4">
          <p className="text-lg text-ink">{payload.prompt}</p>
          <div className="flex flex-wrap gap-3">
            {payload.stickers.map((s: any) => (
              <span key={s.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-white shadow-card text-ink font-medium">
                <VocabIllustration imgHint={s.imgHint} size={36} />
                {s.label}
              </span>
            ))}
          </div>
          <div className="p-4 rounded-card bg-coral/10">
            <p className="text-lg text-ink">{payload.speakingPrompt}</p>
          </div>
        </div>
      );
    case 'recordAndCompare':
      return (
        <div className="space-y-4">
          <div className="p-5 rounded-card bg-coral/10">
            <p className="text-xs font-medium text-muted mb-1">Model line</p>
            <p className="text-xl text-ink italic">"{payload.modelLine}"</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {payload.keywords.map((k: string) => (
              <span key={k} className="px-4 py-2 rounded-pill bg-sun/15 text-ink font-medium">{k}</span>
            ))}
          </div>
        </div>
      );
    case 'diaryPrompt':
      return (
        <div className="space-y-4">
          {payload.wordBank?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">Word bank</p>
              <div className="flex flex-wrap gap-2.5">
                {payload.wordBank.map((w: string) => (
                  <span key={w} className="px-4 py-2 rounded-pill bg-white shadow-card text-ink font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
          <ul className="space-y-2">
            {payload.checklist.map((c: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-lg text-ink">
                <span className="w-6 h-6 rounded border-2 border-brand/30 shrink-0" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      );
    case 'listenAndDraw':
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {payload.tools?.map((t: any) => (
              <span key={t.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-white shadow-card font-medium" style={{ color: t.color }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      );
    default:
      return <p className="text-lg text-muted">This activity type has no presentation view yet.</p>;
  }
}

function ReadingPanel({ texts, level, activity }: { texts: ReturnType<typeof getUnitReading>['readingTexts']; level: Level; activity: Activity }) {
  const text1 = texts[0];
  const text2 = texts[1];
  const text = activity.prompt.includes(text1.title) ? text1 : text2;

  return (
    <div className="mb-6 p-6 rounded-card bg-cream border border-gray-100">
      <h2 className="font-heading font-700 text-xl text-ink mb-3">{text.title}</h2>
      <p className="text-lg text-ink leading-relaxed whitespace-pre-line">{text[level].text}</p>
    </div>
  );
}

function ListeningPanel({ script }: { script: string }) {
  if (!script) return null;
  return (
    <div className="mb-6 p-6 rounded-card bg-violet/10">
      <div className="flex items-center gap-3 mb-3">
        <AudioButton audioKey={`present-listen-${script.slice(0, 12)}`} fallbackText={script} label="Play audio" />
      </div>
      <p className="text-lg text-ink italic">{script}</p>
    </div>
  );
}
