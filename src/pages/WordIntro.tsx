import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getUnit } from '../data/units';
import { useProgress } from '../context/ProgressContext';
import { FlipCard } from '../components/FlipCard';

/**
 * Word Introduction — phase before the question activities. Every unit word
 * gets a flip card: word + pronunciation on the front, example sentence on
 * the back. Flipping a card for the first time marks the word introduced.
 */
export function WordIntro() {
  const { unitId } = useParams();
  const unit = getUnit(Number(unitId));
  const { isVocabIntroduced, markVocabIntroduced, settings } = useProgress();
  const [setFilter, setSetFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  const items = useMemo(() => {
    if (!unit) return [];
    return setFilter === 'all' ? unit.vocabulary : unit.vocabulary.filter(v => v.set === setFilter);
  }, [unit, setFilter]);

  const total = unit?.vocabulary.length ?? 0;
  const introduced = unit?.vocabulary.filter(v => isVocabIntroduced(v.id)).length ?? 0;

  if (!unit)
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="font-heading text-xl font-bold text-ink">Unit not found</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-pill bg-brand px-6 py-2.5 font-bold text-white transition-colors hover:bg-emerald-700">
          Back to dashboard
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <Link
        to={`/unit/${unit.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to Unit {unit.id}
      </Link>

      <header className="mb-8">
        <p className="eyebrow mb-2 flex items-center gap-2">
          <BookOpen size={14} /> Word introduction
        </p>
        <h1 className="font-heading text-3xl font-extrabold text-ink lg:text-4xl">
          Meet the words of {unit.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Flip each card to see its example sentence. Tap the speaker to hear the word, then
          the sentence — say it out loud before you move on.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 w-48 overflow-hidden rounded-pill bg-slate-200">
            <div
              className="h-full rounded-pill bg-mint transition-all"
              style={{ width: total ? `${(introduced / total) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-sm font-bold text-ink">
            {introduced}/{total} words met
          </p>
        </div>
      </header>

      {total > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by word set">
          {(['all', 'A', 'B', 'C'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSetFilter(s)}
              aria-pressed={setFilter === s}
              className={
                setFilter === s
                  ? 'rounded-pill bg-brand px-4 py-1.5 text-sm font-bold text-white'
                  : 'rounded-pill border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:border-brand hover:text-brand'
              }
            >
              {s === 'all' ? 'All words' : `Set ${s}`}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <FlipCard
            key={item.id}
            item={item}
            introduced={isVocabIntroduced(item.id)}
            reducedMotion={settings.reducedMotion}
            onFirstFlip={() => markVocabIntroduced(item.id)}
          />
        ))}
      </div>

      {introduced === total && total > 0 && (
        <div className="surface-card mt-8 p-6 text-center">
          <p className="font-heading text-xl font-extrabold text-ink">
            You have met all {total} words. Great job!
          </p>
          <p className="mt-1 text-muted">Now head back and put them to work in the stations.</p>
          <Link
            to={`/unit/${unit.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-pill bg-brand px-6 py-2.5 font-bold text-white transition-colors hover:bg-emerald-700"
          >
            Back to Unit {unit.id}
          </Link>
        </div>
      )}
    </div>
  );
}

export default WordIntro;
