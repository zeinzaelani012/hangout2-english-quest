import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ChevronRight, ArrowLeft, Lightbulb, Check, X, Star } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import {
  getUnit, getUnitReading, getUnitGrammarPatterns,
  type UnitReading, type UnitGrammarPattern, type UnitReadingContext,
} from '../data/units';
import { LEVEL_LABELS, SKILL_LABELS, SKILL_COLORS, type Level, type Activity, type StationProgress } from '../types';
import { CookieMascot, StationBadge } from '../components/Illustrations';
import { AudioButton } from '../components/AudioButton';
import { PictureMatch } from '../components/activities/PictureMatch';
import { DragSort } from '../components/activities/DragSort';
import { GapFill } from '../components/activities/GapFill';
import { ListenAndDraw } from '../components/activities/ListenAndDraw';
import { RecordAndCompare } from '../components/activities/RecordAndCompare';
import { SentenceBuilder } from '../components/activities/SentenceBuilder';
import { StickerPlate } from '../components/activities/StickerPlate';
import { DiaryPrompt } from '../components/activities/DiaryPrompt';

export function ActivityPage() {
  const { unitId, level, stationId } = useParams();
  const navigate = useNavigate();
  const { saveStationProgress, isStationCompleted, recordVocabCorrect, progress } = useProgress();

  const unit = getUnit(parseInt(unitId || '0'));
  const levelKey = (level || 'easy') as Level;
  const station = unit?.stations.find(s => s.id === stationId);
  const readings = getUnitReading(unit?.id || 1);
  const grammarPatterns = getUnitGrammarPatterns(unit?.id || 1);

  // Get activities for this station from the level data
  const activities = useMemo(() => {
    if (!unit || !station) return [];

    // Boss station uses dedicated boss activities from the content pack
    if (station.id === 'boss') {
      return unit.bossActivities?.[levelKey] ?? [];
    }

    // Map station skill to activities
    return unit.levels[levelKey].filter(a => a.skill === station.skill);
  }, [unit, station, levelKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, { correct: boolean; error?: { correctAnswer: string; rule: string } }>>({});
  const [showHint, setShowHint] = useState(false);
  const [stationComplete, setStationComplete] = useState(false);

  if (!unit || !station || activities.length === 0) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-800 text-2xl text-ink mb-4">No activities found</h1>
        <Link to={`/unit/${unit?.id || 1}/${levelKey}`} className="text-brand hover:underline">
          Back to Quest Map
        </Link>
      </div>
    );
  }

  const currentActivity = activities[currentIndex];
  const isLastActivity = currentIndex >= activities.length - 1;

  const handleResult = (correct: boolean, error?: { correctAnswer: string; rule: string }) => {
    setResults(prev => ({
      ...prev,
      [currentActivity.id]: { correct, error: correct ? undefined : error },
    }));

    // Record vocab mastery
    if (correct && currentActivity.type === 'pictureMatch') {
      const payload = currentActivity.payload as any;
      if (payload.options) {
        const correctOption = payload.options.find((o: any) => o.id === payload.answerId);
        if (correctOption?.vocabId) {
          recordVocabCorrect(correctOption.vocabId);
        }
      }
    }
  };

  const handleNext = () => {
    if (isLastActivity) {
      // Complete station
      const correctCount = Object.values(results).filter(r => r.correct).length;
      const xpEarned = Math.round((correctCount / activities.length) * getStationXP(station.skill));
      const errors = Object.entries(results)
        .filter(([_, r]) => !r.correct && r.error)
        .map(([activityId, r]) => ({
          activityId,
          correctAnswer: r.error!.correctAnswer,
          rule: r.error!.rule,
        }));

      const stationProgress: StationProgress = {
        completed: true,
        xpEarned,
        attempts: Object.fromEntries(Object.entries(results).map(([id, r]) => [id, r.correct])),
        errors,
      };

      saveStationProgress(unit.id, levelKey, station.id, stationProgress);
      setStationComplete(true);

      // Navigate to results after a brief delay
      setTimeout(() => {
        navigate('/results', {
          state: {
            unitId: unit.id,
            level: levelKey,
            stationId: station.id,
            stationName: station.name,
            skill: station.skill,
            xpEarned,
            xpTotal: getStationXP(station.skill),
            correctCount,
            totalCount: activities.length,
            errors,
            isBoss: station.id === 'boss',
          },
        });
      }, 1500);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowHint(false);
    }
  };

  const renderActivity = () => {
    if (!currentActivity) return null;

    switch (currentActivity.type) {
      case 'pictureMatch':
        return <PictureMatch activity={currentActivity} onResult={handleResult} />;
      case 'dragSort':
        return <DragSort activity={currentActivity} onResult={handleResult} />;
      case 'gapFill':
        return <GapFill activity={currentActivity} onResult={handleResult} />;
      case 'listenAndDraw':
        return <ListenAndDraw activity={currentActivity} onResult={handleResult} />;
      case 'recordAndCompare':
        return <RecordAndCompare activity={currentActivity} onResult={handleResult} />;
      case 'sentenceBuilder':
        return <SentenceBuilder activity={currentActivity} onResult={handleResult} />;
      case 'stickerPlate':
        return <StickerPlate activity={currentActivity} onResult={handleResult} />;
      case 'diaryPrompt':
        return <DiaryPrompt activity={currentActivity} onResult={handleResult} />;
      default:
        return <p>This activity type is not yet supported.</p>;
    }
  };

  const currentResult = results[currentActivity?.id];
  const skillColor = station.id === 'boss' ? '#0F766E' : SKILL_COLORS[station.skill];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-4 sm:px-6 sm:py-6">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:rounded-card sm:border sm:px-4 sm:shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(`/unit/${unit.id}/${levelKey}`)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-slate-100"
              aria-label="Back to quest map"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-extrabold text-ink">{station.name}</p>
              <p className="text-xs font-semibold text-muted">
                {currentIndex + 1} of {activities.length}
                {station.id !== 'boss' && ` · ${SKILL_LABELS[station.skill]}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="tnum rounded-lg px-2.5 py-1.5 text-xs font-bold"
              style={{ backgroundColor: `${skillColor}15`, color: skillColor }}
            >
              {currentActivity?.xp || 0} XP
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-pill transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / activities.length) * 100}%`,
              backgroundColor: skillColor,
            }}
          />
        </div>
      </div>

      <h1 className="sr-only">{station.name} — Activity {currentIndex + 1}</h1>

      {/* Teaching card at the top of the Grammar station */}
      {station.skill === 'grammar' && (
        <GrammarTeachingCard patterns={grammarPatterns} audioKey={`grammar-card-${currentActivity.id}`} />
      )}

      {/* Pre-activity content: reading text or listening dialogue */}
      {currentActivity.skill === 'reading' && currentActivity.type === 'gapFill' && (
        <ReadingTextDisplay level={levelKey} activity={currentActivity} texts={readings.readingTexts} />
      )}
      {currentActivity.skill === 'listening' && currentActivity.type === 'gapFill' && (
        <ListeningAudioDisplay activity={currentActivity} level={levelKey} dialogue={readings.dialogue} />
      )}
      {currentActivity.skill === 'listening' && currentActivity.type === 'pictureMatch' && (
        <ListeningAudioDisplay activity={currentActivity} level={levelKey} dialogue={readings.dialogue} />
      )}
      {station.id === 'boss' && currentActivity.skill === 'reading' && (
        currentActivity.prompt.includes(`"${readings.dialogue.title}"`) ? (
          <ListeningAudioDisplay activity={currentActivity} level={levelKey} dialogue={readings.dialogue} />
        ) : (
          <ReadingTextDisplay level={levelKey} activity={currentActivity} texts={readings.readingTexts} />
        )
      )}

      {/* Activity body — keyed by activity id so consecutive same-type
          activities (e.g. gapFill → gapFill) start with fresh state */}
      <div key={currentActivity.id} className="surface-card mb-4 p-5 sm:p-8">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <p className="eyebrow mb-2">Activity {currentIndex + 1}</p>
          <p className="text-base font-bold leading-7 text-ink sm:text-lg">{currentActivity.prompt}</p>
        </div>
        {renderActivity()}
      </div>

      {/* Feedback panel */}
      {currentResult && (
        <div
          className={`mb-4 rounded-card border p-4 ${
            currentResult.correct
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}
          aria-live="polite"
          role="status"
        >
          <div className="flex items-start gap-3">
            {currentResult.correct ? (
              <Check size={20} className="text-mint shrink-0 mt-0.5" />
            ) : (
              <X size={20} className="text-coral shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-heading text-sm font-extrabold text-ink">
                {currentResult.correct ? 'Correct' : 'Review this answer'}
              </p>
              {currentResult.error && (
                <p className="text-sm text-muted mt-1">
                  <span className="font-medium text-ink">Answer: </span>
                  {currentResult.error.correctAnswer}
                  <br />
                  <span className="font-medium text-ink">Why: </span>
                  {currentResult.error.rule}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer: hint + action */}
      <div className="sticky bottom-16 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-lg sm:bottom-4 sm:mx-0 sm:rounded-card sm:border sm:shadow-card">
        {/* Hint button */}
        <button
          onClick={() => setShowHint(!showHint)}
          className="action-secondary text-sm"
          style={{ minHeight: 44 }}
          aria-expanded={showHint}
          aria-label="Show hint"
        >
          <Lightbulb size={18} className="text-sun" />
          <span className="hidden sm:inline">Hint</span>
        </button>

        {/* Action button */}
        <button
          onClick={handleNext}
          disabled={!currentResult}
          className="action-primary min-w-28 px-6"
          style={{ minHeight: 44 }}
        >
          {isLastActivity ? (
            <>Finish <Star size={16} /></>
          ) : (
            <>Next <ChevronRight size={18} /></>
          )}
        </button>
      </div>

      {/* Hint bubble */}
      {showHint && (
        <div className="fixed bottom-36 left-4 right-4 z-30 sm:bottom-24 sm:left-auto sm:right-8 sm:max-w-sm">
          <div className="surface-card flex items-start gap-3 p-4 shadow-cardhover">
            <CookieMascot size={40} className="shrink-0" />
            <div>
              <p className="eyebrow mb-1">Cookie's hint</p>
              <p className="text-sm leading-6 text-ink">{getHint(currentActivity)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Station complete overlay */}
      {stationComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="surface-card p-8 text-center shadow-2xl">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Check size={34} className="text-mint" />
            </span>
            <p className="font-heading text-xl font-extrabold text-ink">Station complete</p>
            <p className="mt-1 text-sm text-muted">Saving your progress...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getStationXP(skill: string): number {
  const weights: Record<string, number> = {
    speaking: 25, vocabulary: 25, listening: 10, reading: 15, writing: 10, grammar: 15,
  };
  return weights[skill] || 25;
}

function getHint(activity: Activity): string {
  if (!activity) return '';
  const payload = activity.payload as any;
  if (payload.hint) return payload.hint;
  if (payload.why) return payload.why;
  return 'Take your time and try your best!';
}

function GrammarTeachingCard({ patterns, audioKey }: { patterns: UnitGrammarPattern[]; audioKey: string }) {
  const spoken = patterns
    .map(p => `${p.label}. ${p.examples.join('. ')}. ${p.note || p.rule || ''}`)
    .join(' ');

  return (
    <div className="surface-card mb-4 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Grammar focus</p>
          <h3 className="font-heading text-lg font-extrabold text-ink">Teaching card</h3>
        </div>
        <AudioButton audioKey={audioKey} fallbackText={spoken} label="Read aloud" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {patterns.map(pattern => (
          <div key={pattern.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-heading text-sm font-extrabold text-ink">{pattern.label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pattern.examples.map((example, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
                >
                  {example}
                </span>
              ))}
            </div>
            {(pattern.note || pattern.rule) && (
              <p className="mt-2.5 text-xs leading-5 text-muted">{pattern.note || pattern.rule}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingTextDisplay({ level, activity, texts }: { level: Level; activity: Activity; texts: UnitReading[] }) {
  // Determine which reading text based on the activity prompt
  const text1 = texts[0];
  const text2 = texts[1];
  const isText1 = activity.prompt.includes(text1.title);
  const text = isText1 ? text1 : text2;
  const levelText = text[level];
  const raw = levelText.text;
  const spoken = Array.isArray(raw)
    ? raw.map(line => `${line.speaker}: ${line.text}`).join(' ')
    : raw;

  return (
    <div className="surface-card mb-4 p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Read</p>
          <h3 className="font-heading text-lg font-extrabold text-ink">{text.title}</h3>
        </div>
        <AudioButton
          audioKey={`reading-${activity.id}`}
          fallbackText={spoken}
          label="Read aloud"
        />
      </div>
      {Array.isArray(raw) ? (
        // ReadingPassage: a message thread rendered as speaker lines
        <div className="space-y-2">
          {raw.map((line, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 ${
                line.speaker === raw[0]?.speaker
                  ? 'border-violet/20 bg-violet/5'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-sm leading-6 text-ink">
                <span className="font-bold text-violet">{line.speaker}: </span>
                {line.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-ink">{raw}</p>
      )}
    </div>
  );
}

function ListeningAudioDisplay({ activity, level, dialogue }: { activity: Activity; level: Level; dialogue: UnitReadingContext['dialogue'] }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const payload = activity.payload as any;
  const script: string = payload.audioScript || '';

  // For boss dialogue activities, show the dialogue lines as transcript
  const isDialogue = activity.skill === 'reading' && activity.prompt.includes(`"${dialogue.title}"`);

  return (
    <div className="surface-card mb-4 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <AudioButton
          audioKey={`listen-${activity.id}`}
          fallbackText={script}
          rate={level === 'challenging' ? 1.0 : 0.9}
          label="Listen"
        />
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="action-secondary text-sm"
          style={{ minHeight: 44 }}
          aria-expanded={showTranscript}
        >
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>
      {showTranscript && (
        <div className="rounded-xl border border-violet/20 bg-violet/5 p-4">
          {isDialogue ? (
            <div className="space-y-1.5">
              {dialogue.lines.map((line, i) => (
                <p key={i} className="text-sm leading-6 text-ink">
                  <span className="font-bold text-violet">{line.speaker}:</span> {line.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm italic leading-6 text-ink">{script}</p>
          )}
        </div>
      )}
    </div>
  );
}
