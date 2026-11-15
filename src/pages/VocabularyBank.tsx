import { useState, useMemo } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { vocabulary } from '../data/units';
import { VocabIllustration as VocabIllus, CookieMascot } from '../components/Illustrations';
import { AudioButton as AudioBtn } from '../components/AudioButton';
import { useProgress } from '../context/ProgressContext';

export function VocabularyBank() {
  const { getVocabMastery } = useProgress();
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return vocabulary.filter(v => {
      if (filter !== 'all' && v.set !== filter) return false;
      if (search && !v.word.toLowerCase().includes(search.toLowerCase()) &&
          !v.example.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const masteredCount = vocabulary.filter(v => getVocabMastery(v.id) >= 2).length;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      <h1 className="font-heading font-800 text-2xl text-ink mb-2">Vocabulary Bank</h1>
      <p className="text-muted mb-4">
        {vocabulary.length} words · {masteredCount} mastered
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-10 pr-4 py-2.5 rounded-pill border border-gray-200 bg-white text-ink focus:outline-none focus:border-brand"
            style={{ minHeight: 44 }}
            aria-label="Search vocabulary"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'A', 'B', 'C'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand text-white'
                  : 'bg-white shadow-card text-ink hover:bg-gray-50'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(word => {
            const mastery = getVocabMastery(word.id);
            const mastered = mastery >= 2;

            return (
              <div
                key={word.id}
                className="bg-white rounded-card shadow-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <VocabIllus imgHint={word.imgHint} size={56} />
                    <div>
                      <p className="font-heading font-700 text-ink">{word.word}</p>
                      <p className="text-xs text-muted capitalize">{word.category} · Set {word.set}</p>
                    </div>
                  </div>
                  {mastered && (
                    <div className="flex items-center gap-1 text-mint" title="Mastered">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-medium">Mastered</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted italic">"{word.example}"</p>

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
                        className={`h-1.5 flex-1 rounded-pill ${i <= mastery ? 'bg-mint' : 'bg-gray-100'}`}
                      />
                    ))}
                    <span className="text-xs text-muted ml-1">{mastery}/2 correct</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CookieMascot size={64} className="mx-auto mb-4" />
          <p className="text-muted">No words found. Try a different search or filter.</p>
        </div>
      )}
    </div>
  );
}
