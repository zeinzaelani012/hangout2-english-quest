import { useEffect, useState } from 'react';
import type { Activity, SentenceBuilderPayload } from '../../types';
import { Check, X } from 'lucide-react';
import { AudioButton } from '../AudioButton';
import { majorityCorrect, normalizeSentence, v2Items, type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

// ---- v2 TILE_SEQUENCE ---------------------------------------------------------
// types: sentenceBuilder, spelling.

interface TileItem {
  id?: string;
  tiles?: string[];
  letters?: string[];
  answer: string;
  audio?: string;
}

function TileSequenceBody({ activity, onResult }: Props) {
  const items: TileItem[] = v2Items(activity.payload).map(raw => ({
    id: raw.id,
    tiles: raw.tiles ?? raw.letters,
    answer: raw.answer,
    audio: raw.audio,
  }));
  const isSpelling = activity.type === 'spelling';

  const [index, setIndex] = useState(0);
  const [bank, setBank] = useState<{ id: string; word: string; used: boolean }[]>([]);
  const [arranged, setArranged] = useState<{ id: string; word: string }[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const item = items[index];
  const isLast = index >= items.length - 1;

  // Reset the tile state whenever the item changes (effect, not render)
  useEffect(() => {
    const tiles = items[index]?.tiles ?? [];
    setBank(tiles.map((word, i) => ({ id: `t${index}-${i}`, word, used: false })));
    setArranged([]);
    setChecked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleAddWord = (id: string, word: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => (w.id === id ? { ...w, used: true } : w)));
    setArranged(prev => [...prev, { id, word }]);
  };

  const handleRemoveWord = (id: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => (w.id === id ? { ...w, used: false } : w)));
    setArranged(prev => prev.filter(w => w.id !== id));
  };

  const clearAll = () => {
    if (checked) return;
    setBank(prev => prev.map(w => ({ ...w, used: false })));
    setArranged([]);
  };

  // Drag and drop: tiles into the build area, back out to the bank
  const handleDragStart = (e: React.DragEvent, id: string, word: string, fromBank: boolean) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, word, fromBank }));
  };

  const handleDropOnArranged = (e: React.DragEvent) => {
    e.preventDefault();
    if (checked) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.fromBank) handleAddWord(data.id, data.word);
    } catch { /* ignore malformed drops */ }
    setDraggedId(null);
  };

  const handleDropOnBank = (e: React.DragEvent) => {
    e.preventDefault();
    if (checked) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data.fromBank) handleRemoveWord(data.id);
    } catch { /* ignore malformed drops */ }
    setDraggedId(null);
  };

  // Spelling joins letters with no spaces; sentences join words. Spelling
  // comparisons ignore spaces entirely, so a pack can ship a two-word answer
  // ("swing set") with a space tile and accept it built with or without it.
  const userSentence = arranged.map(w => w.word).join(isSpelling ? '' : ' ');
  const spellingNorm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
  const isCorrect = item
    ? isSpelling
      ? spellingNorm(userSentence) === spellingNorm(item.answer)
      : normalizeSentence(userSentence) === normalizeSentence(item.answer)
    : false;

  const handleCheck = () => {
    setChecked(true);
    const nextResults = [...results, isCorrect];
    setResults(nextResults);
    if (isLast) {
      onResult(majorityCorrect(nextResults), {
        correctAnswer: items.map(i => i.answer).join('; '),
        rule: isSpelling ? 'Spell each word letter by letter.' : 'Word order and punctuation both count.',
      });
    }
  };

  const handleNext = () => {
    setIndex(i => i + 1);
    setBank([]);
    setArranged([]);
    setChecked(false);
  };

  if (!item) return null;

  return (
    <div>
      {items.length > 1 && (
        <p className="eyebrow mb-2 tnum">Item {index + 1} of {items.length}</p>
      )}
      {isSpelling && (
        <p className="mb-3 text-sm text-muted">Build the word from its letters.</p>
      )}

      {item.audio && (
        <div className="mb-4">
          <AudioButton
            audioKey={`tile-${activity.id}-${item.id ?? index}`}
            fallbackText={item.audio}
            rate={0.8}
            label="Hear the word"
          />
        </div>
      )}

      {/* Build area */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropOnArranged}
        className="mb-4 flex min-h-[80px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-slate-50 p-4"
        aria-label="Build area. Click or drag tiles here."
      >
        {arranged.length === 0 && (
          <p className="text-sm text-muted">Click or drag the tiles below to build {isSpelling ? 'the word' : 'your sentence'}...</p>
        )}
        {arranged.map(word => (
          <button
            key={word.id}
            onClick={() => handleRemoveWord(word.id)}
            draggable
            onDragStart={e => handleDragStart(e, word.id, word.word, false)}
            onDragOver={e => e.preventDefault()}
            disabled={checked}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
              checked
                ? 'border-brand/20 bg-teal-50 text-brand'
                : 'border-slate-200 bg-white text-ink hover:border-red-200 hover:bg-red-50 hover:text-coral'
            }`}
            style={{ minHeight: 36 }}
            aria-label={`${word.word}. Click to remove.`}
          >
            {word.word}
            {!checked && <X size={12} className="ml-1 inline opacity-50" />}
          </button>
        ))}
      </div>

      {/* Tile bank */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropOnBank}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">{isSpelling ? 'Letters' : 'Word bank'}</p>
          {!checked && arranged.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-bold text-muted hover:text-coral"
              aria-label="Clear the build area"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {bank.map(word =>
            !word.used ? (
              <button
                key={word.id}
                onClick={() => handleAddWord(word.id, word.word)}
                draggable
                onDragStart={e => handleDragStart(e, word.id, word.word, true)}
                disabled={checked}
                className="min-h-9 cursor-grab rounded-lg border border-brand/20 bg-teal-50 px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-teal-100"
                style={{ minHeight: 36, ...(word.word.trim() === '' ? { minWidth: 30 } : {}) }}
                aria-label={word.word.trim() === '' ? 'Space. Click or drag to add.' : `${word.word}. Click or drag to add.`}
              >
                {word.word.trim() === '' ? '␣' : word.word}
              </button>
            ) : null,
          )}
          {bank.every(w => w.used) && !checked && (
            <p className="text-sm text-muted">
              All tiles used{arranged.length > 0 ? ' — check when ready.' : '.'}
            </p>
          )}
        </div>
      </div>

      {/* Check / next */}
      {arranged.length > 0 && !checked && (
        <button onClick={handleCheck} className="action-primary mt-4 w-full">
          Check {isSpelling ? 'spelling' : 'sentence'}
        </button>
      )}

      {checked && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <p className="flex items-center gap-2 font-heading text-sm font-extrabold text-ink">
            {isCorrect ? <Check size={18} className="text-mint" /> : <X size={18} className="text-coral" />}
            {isCorrect ? (isSpelling ? 'Correct spelling' : 'Perfect sentence') : 'Not quite — the answer is:'}
          </p>
          {!isCorrect && (
            <p className="mt-1 text-sm font-bold text-ink">“{item.answer}”</p>
          )}
          {!isCorrect && userSentence && (
            <p className="mt-1 text-sm text-muted">You built: “{userSentence}”</p>
          )}
        </div>
      )}

      {checked && !isLast && (
        <button onClick={handleNext} className="action-primary mt-4">
          Next item
        </button>
      )}
    </div>
  );
}

// ---- Legacy single-sentence builder (Units 2/3) --------------------------------

function LegacySentenceBuilder({ activity, onResult }: Props) {
  const payload = activity.payload as SentenceBuilderPayload;
  const [bank, setBank] = useState<{ id: string; word: string; used: boolean }[]>(payload.scrambled.map((word, i) => ({ id: `w${i}`, word, used: false })));
  const [arranged, setArranged] = useState<{ id: string; word: string }[]>([]);
  const [checked, setChecked] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleAddWord = (id: string, word: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => (w.id === id ? { ...w, used: true } : w)));
    setArranged(prev => [...prev, { id, word }]);
  };

  const handleRemoveWord = (id: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => (w.id === id ? { ...w, used: false } : w)));
    setArranged(prev => prev.filter(w => w.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string, word: string, fromBank: boolean) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, word, fromBank }));
  };

  const handleDropOnArranged = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.fromBank) {
      setBank(prev => prev.map(w => (w.id === data.id ? { ...w, used: true } : w)));
      setArranged(prev => [...prev.slice(0, targetIdx), { id: data.id, word: data.word }, ...prev.slice(targetIdx)]);
    }
    setDraggedId(null);
  };

  const handleDropOnBank = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!data.fromBank) {
      handleRemoveWord(data.id);
    }
    setDraggedId(null);
  };

  const handleCheck = () => {
    setChecked(true);
    const userSentence = arranged.map(w => w.word).join(' ').trim();
    const isCorrect = userSentence.toLowerCase() === payload.answer.toLowerCase();
    onResult(isCorrect, {
      correctAnswer: payload.answer,
      rule: payload.why,
    });
  };

  const userSentence = arranged.map(w => w.word).join(' ');

  return (
    <div>
      {/* Arranged sentence area */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.fromBank) {
            handleAddWord(data.id, data.word);
          }
        }}
        className="mb-4 flex min-h-[80px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-slate-50 p-4"
        aria-label="Sentence area. Drop or click words here to build your sentence."
      >
        {arranged.length === 0 && (
          <p className="text-sm text-muted">Click or drag words here to build your sentence...</p>
        )}
        {arranged.map((word, idx) => (
          <button
            key={word.id}
            onClick={() => handleRemoveWord(word.id)}
            draggable
            onDragStart={e => handleDragStart(e, word.id, word.word, false)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDropOnArranged(e, idx)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
              checked
                ? 'border-brand/20 bg-teal-50 text-brand'
                : 'border-slate-200 bg-white text-ink hover:border-red-200 hover:bg-red-50 hover:text-coral'
            }`}
            style={{ minHeight: 36 }}
            aria-label={`${word.word}. Click to remove.`}
          >
            {word.word}
            {!checked && <X size={12} className="ml-1 inline opacity-50" />}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropOnBank}
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <p className="eyebrow mb-2">Word bank</p>
        <div className="flex flex-wrap gap-2">
          {bank.map(word =>
            !word.used ? (
              <button
                key={word.id}
                onClick={() => handleAddWord(word.id, word.word)}
                draggable
                onDragStart={e => handleDragStart(e, word.id, word.word, true)}
                className="draggable-item min-h-9 cursor-grab rounded-lg border border-brand/20 bg-teal-50 px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-teal-100"
                style={{ minHeight: 36 }}
                aria-label={`${word.word}. Click or drag to add to sentence.`}
              >
                {word.word}
              </button>
            ) : null,
          )}
          {bank.every(w => w.used) && !checked && (
            <p className="text-sm text-muted">All words used. Check your sentence!</p>
          )}
        </div>
      </div>

      {/* Check button */}
      {arranged.length > 0 && !checked && (
        <button onClick={handleCheck} className="action-primary mt-4 w-full">
          Check sentence
        </button>
      )}

      {checked && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            userSentence.toLowerCase() === payload.answer.toLowerCase()
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-start gap-2">
            {userSentence.toLowerCase() === payload.answer.toLowerCase() ? (
              <Check size={20} className="mt-0.5 shrink-0 text-mint" />
            ) : (
              <X size={20} className="mt-0.5 shrink-0 text-coral" />
            )}
            <div>
              <p className="text-sm font-semibold text-ink">
                {userSentence.toLowerCase() === payload.answer.toLowerCase()
                  ? 'Perfect sentence!'
                  : 'Not quite. The correct sentence is:'}
              </p>
              {userSentence.toLowerCase() !== payload.answer.toLowerCase() && (
                <p className="mt-1 text-sm font-bold text-ink">"{payload.answer}"</p>
              )}
              <p className="mt-1 text-sm text-muted">{payload.why}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SentenceBuilder(props: Props) {
  // v2 (expanded pack) payloads are slot entries with an items array.
  if (Array.isArray((props.activity.payload as Record<string, any>)?.items)) {
    return <TileSequenceBody {...props} />;
  }
  return <LegacySentenceBuilder {...props} />;
}
