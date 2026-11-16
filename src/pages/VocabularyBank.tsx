import { useState, useMemo } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { vocabularyBank } from '../data/units';
import { VocabIllustration as VocabIllus, CookieMascot } from '../components/Illustrations';
import { AudioButton as AudioBtn } from '../components/AudioButton';
import { useProgress } from '../context/ProgressContext';

export function VocabularyBank() {
  const { getVocabMastery } = useProgress();
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return vocabularyBank.filter(v => {
      if (filter !== 'all' && v.set !== filter) return false;
      if (search && !v.word.toLowerCase().includes(search.toLowerCase()) &&
          !v.example.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const masteredCount = vocabularyBank.filter(v => getVocabMastery(v.id) >= 2).length;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <p className="eyebrow mb-2">Word reference</p>
      <h1 className="mb-2 font-heading text-3xl font-extrabold text-ink">Vocabulary bank</h1>
      <p className="mb-6 text-sm font-semibold text-muted">
        {vocabularyBank.length} words · {masteredCount} mastered
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            style={{ minHeight: 44 }}
            aria-label="Search vocabulary"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'A', 'B', 'C'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                filter === f
                  ? 'border-brand bg-brand text-white'
                  : 'border-slate-200 bg-white text-ink hover:bg-slate-50'
              }`}
              style={{ minHeight: 44 }}
              aria-pressed={filter === f}
            >
              {f === 'all' ? 'All' : `Set ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Word cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(word => {
            const mastery = getVocabMastery(word.id);
            const mastered = mastery >= 2;

            return (
              <div
                key={word.id}
                className="surface-card flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <VocabIllus imgHint={word.imgHint} size={56} />
                    <div>
                      <p className="font-heading text-base font-extrabold text-ink">{word.word}</p>
                      <p className="text-xs text-muted capitalize">Unit {word.unitId} · {word.category} · Set {word.set}</p>
                    </div>
                  </div>
                  {mastered && (
                    <div className="flex items-center gap-1 text-mint" title="Mastered">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-medium">Mastered</span>
                    </div>
                  )}
                </div>

                <p className="text-sm italic leading-6 text-muted">"{word.example}"</p>

                <div className="flex items-center gap-2 mt-auto">
                  <AudioBtn
                    audioKey={`vocab-${word.id}`}
                    fallbackText={word.word}
                    rate={0.9}
                    label="Hear it"
                  />
                  <AudioBtn
                    audioKey={`vocab-example-${word.id}`}
                    fallbackText={word.example}
                    rate={0.9}
                    label="Hear example"
                  />
                </div>

                {/* Mastery progress */}
                {mastery > 0 && !mastered && (
                  <div className="flex items-center gap-1">
                    {[1, 2].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i <= mastery ? 'bg-mint' : 'bg-slate-100'}`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-muted">{mastery}/2 correct</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface-card px-6 py-14 text-center">
          <CookieMascot size={64} className="mx-auto mb-4" />
          <p className="text-muted">No words found. Try a different search or filter.</p>
        </div>
      )}
    </div>
  );
}
