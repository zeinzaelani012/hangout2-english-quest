import { useState } from 'react';
import type { Activity, SentenceBuilderPayload } from '../../types';
import { Check, X } from 'lucide-react';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function SentenceBuilder({ activity, onResult }: Props) {
  const payload = activity.payload as SentenceBuilderPayload;
  const [bank, setBank] = useState<{ id: string; word: string; used: boolean }[]>(payload.scrambled.map((word, i) => ({ id: `w${i}`, word, used: false })));
  const [arranged, setArranged] = useState<{ id: string; word: string }[]>([]);
  const [checked, setChecked] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleAddWord = (id: string, word: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => w.id === id ? { ...w, used: true } : w));
    setArranged(prev => [...prev, { id, word }]);
  };

  const handleRemoveWord = (id: string) => {
    if (checked) return;
    setBank(prev => prev.map(w => w.id === id ? { ...w, used: false } : w));
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
      setBank(prev => prev.map(w => w.id === data.id ? { ...w, used: true } : w));
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
        className="min-h-[80px] p-4 rounded-card bg-cream border-2 border-dashed border-brand/20 mb-4 flex flex-wrap gap-2 items-center"
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
            className={`px-3 py-2 rounded-pill font-medium text-sm transition-all ${
              checked
                ? 'bg-brand/10 text-brand'
                : 'bg-white shadow-card text-ink hover:bg-coral/10 hover:text-coral'
            }`}
            style={{ minHeight: 36 }}
            aria-label={`${word.word}. Click to remove.`}
          >
            {word.word}
            {!checked && <X size={12} className="inline ml-1 opacity-50" />}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropOnBank}
        className="p-4 rounded-card bg-white border border-gray-100"
      >
        <p className="text-xs font-medium text-muted mb-2">Word bank:</p>
        <div className="flex flex-wrap gap-2">
          {bank.map(word => (
            !word.used && (
              <button
                key={word.id}
                onClick={() => handleAddWord(word.id, word.word)}
                draggable
                onDragStart={e => handleDragStart(e, word.id, word.word, true)}
                className="draggable-item px-3 py-2 rounded-pill bg-brand/10 text-brand font-medium text-sm hover:bg-brand/20 transition-colors cursor-grab"
                style={{ minHeight: 36 }}
                aria-label={`${word.word}. Click or drag to add to sentence.`}
              >
                {word.word}
              </button>
            )
          ))}
          {bank.every(w => w.used) && !checked && (
            <p className="text-sm text-muted">All words used. Check your sentence!</p>
          )}
        </div>
      </div>

      {/* Check button */}
      {arranged.length > 0 && !checked && (
        <button
          onClick={handleCheck}
          className="mt-4 w-full py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors"
          style={{ minHeight: 44 }}
        >
          Check sentence
        </button>
      )}

      {checked && (
        <div className="mt-4 p-3 rounded-card" style={{ backgroundColor: userSentence.toLowerCase() === payload.answer.toLowerCase() ? '#2FB59A15' : '#FF6B4A15' }}>
          <div className="flex items-start gap-2">
            {userSentence.toLowerCase() === payload.answer.toLowerCase() ? (
              <Check size={20} className="text-mint shrink-0 mt-0.5" />
            ) : (
              <X size={20} className="text-coral shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-ink">
                {userSentence.toLowerCase() === payload.answer.toLowerCase()
                  ? 'Perfect sentence!'
                  : 'Not quite. The correct sentence is:'}
              </p>
              {userSentence.toLowerCase() !== payload.answer.toLowerCase() && (
                <p className="text-sm font-medium text-ink mt-1">"{payload.answer}"</p>
              )}
              <p className="text-sm text-muted mt-1">{payload.why}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
