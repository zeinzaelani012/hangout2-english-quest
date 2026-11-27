import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { units, getUnitReading } from '../data/units';
import { LEVEL_LABELS, SKILL_LABELS, SKILL_COLORS, type Activity, type Level } from '../types';
import { VocabIllustration } from '../components/Illustrations';
import { AudioButton } from '../components/AudioButton';
import { seededShuffle } from '../lib/shuffle';
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
  // Same seeded order the learner sees, so the projected options are not
  // always answer-first.
  const options: { id: string; label: string; imgHint?: string }[] | null = current
    ? current.type === 'pictureMatch'
      ? payload?.options
        ? seededShuffle(payload.options, `${current.unitId ?? 0}:${current.id}`)
        : null
      : current.type === 'gapFill'
        ? seededShuffle<string>(payload?.options ?? [], `${current.unitId ?? 0}:${current.id}`).map((o: string, i: number) => ({ id: String(i), label: o }))
        : null
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

  // Checkpoint slots carry skill 'mixed' — fall back to the brand colour/label.
  const skillColor = current ? (SKILL_COLORS as Record<string, string>)[current.skill] ?? '#0F766E' : '#0F766E';
  const skillLabel = current ? (SKILL_LABELS as Record<string, string>)[current.skill] ?? 'Mixed skills' : 'Mixed skills';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <span className="font-heading text-lg font-extrabold text-brand">Present mode</span>
          <span className="text-xs text-muted">No XP · nothing is saved</span>
          <span className="flex-1" />
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">Unit</span>
            <select
              value={unitId}
              onChange={e => { setUnitId(parseInt(e.target.value, 10)); reset(); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {PRESENT_LEVELS.map(l => (
                <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => navigate('/teacher')}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
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
            <div className="surface-card mb-4 p-6 sm:p-10">
              {/* Station + counter */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ backgroundColor: `${skillColor}15`, color: skillColor }}
                >
                  {station?.name || skillLabel}
                </span>
                <span className="text-xs text-muted tnum">{index + 1} of {activities.length}</span>
              </div>

              <h1 className="mb-6 font-heading text-2xl font-extrabold text-ink">{current.prompt}</h1>

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
      <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-heading font-bold text-ink hover:bg-slate-50 disabled:opacity-40"
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
            className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-brand px-10 py-4 font-heading font-extrabold text-white hover:bg-teal-800 disabled:opacity-40"
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
              className={`rounded-xl border p-5 flex items-center gap-4 transition-all ${
                isRevealed
                  ? isAnswer
                    ? 'bg-mint/10 ring-2 ring-mint'
                    : 'bg-slate-50 ring-1 ring-slate-200'
                  : 'bg-slate-50 border-2 border-dashed border-slate-200'
              }`}
              style={{ minHeight: 72 }}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-800 text-lg shrink-0 ${
                isRevealed ? 'bg-brand text-white' : 'bg-slate-200/70 text-muted'
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
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-1.5 text-sm font-heading font-bold text-white">
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
              <div key={bin.id} className="rounded-xl border-2 border-dashed border-brand/30 bg-slate-50 p-5">
                <p className="font-heading font-700 text-lg text-ink">{bin.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {payload.items.map((item: any) => (
              <span key={item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-ink">
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
            <span key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-heading text-xl font-bold text-ink">
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
              <span key={s.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-ink">
                <VocabIllustration imgHint={s.imgHint} size={36} />
                {s.label}
              </span>
            ))}
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-lg text-ink">{payload.speakingPrompt}</p>
          </div>
        </div>
      );
    case 'recordAndCompare':
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-medium text-muted mb-1">Model line</p>
            <p className="text-xl text-ink italic">"{payload.modelLine}"</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {payload.keywords.map((k: string) => (
              <span key={k} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-ink">{k}</span>
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
                  <span key={w} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-ink">{w}</span>
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
              <span key={t.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold" style={{ color: t.color }}>
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
  const raw = text[level].text;
  const spoken = Array.isArray(raw)
    ? raw.map(line => `${line.speaker}: ${line.text}`).join(' ')
    : raw;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-heading font-700 text-xl text-ink">{text.title}</h2>
        <AudioButton audioKey={`present-reading-${activity.id}`} fallbackText={spoken} label="Read aloud" />
      </div>
      {Array.isArray(raw) ? (
        <div className="space-y-2">
          {raw.map((line, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${line.speaker === raw[0]?.speaker ? 'border-violet/20 bg-violet/5' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-lg text-ink">
                <span className="font-medium text-violet">{line.speaker}: </span>
                {line.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-lg text-ink leading-relaxed whitespace-pre-line">{raw}</p>
      )}
    </div>
  );
}

function ListeningPanel({ script }: { script: string }) {
  if (!script) return null;
  return (
    <div className="mb-6 rounded-xl border border-violet/20 bg-violet/5 p-6">
      <div className="flex items-center gap-3 mb-3">
        <AudioButton audioKey={`present-listen-${script.slice(0, 12)}`} fallbackText={script} label="Play audio" />
      </div>
      <p className="text-lg text-ink italic">{script}</p>
    </div>
  );
}
