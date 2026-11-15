import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ChevronRight, ArrowLeft, Lightbulb, Check, X, Star } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit, getUnitReading } from '../data/units';
import { LEVEL_LABELS, SKILL_LABELS, SKILL_COLORS, type Level, type Activity, type StationProgress } from '../types';
import { CookieMascot, StationBadge } from '../components/Illustrations';
import { AudioButton } from '../components/AudioButton';
import type { ReadingJSON, DialogueJSON } from '../data/unit1/contentPack';
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
  const skillColor = station.id === 'boss' ? '#2B3A8F' : SKILL_COLORS[station.skill];

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm pt-2 pb-3 mb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(`/unit/${unit.id}/${levelKey}`)}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-ink shrink-0"
              aria-label="Back to quest map"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="font-heading font-700 text-sm text-ink truncate">{station.name}</p>
              <p className="text-xs text-muted">
                {currentIndex + 1} of {activities.length}
                {station.id !== 'boss' && ` · ${SKILL_LABELS[station.skill]}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2.5 py-1 rounded-pill font-medium tnum"
              style={{ backgroundColor: `${skillColor}15`, color: skillColor }}
            >
              {currentActivity?.xp || 0} XP
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-pill bg-gray-100 overflow-hidden mt-2">
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
        <ListeningAudioDisplay activity={currentActivity} level={levelKey} dialogue={readings.dialogue} />
      )}

      {/* Activity body */}
      <div className="bg-white rounded-card shadow-card p-6 sm:p-8 mb-4">
        <p className="text-base text-ink mb-6 font-medium">{currentActivity.prompt}</p>
        {renderActivity()}
      </div>

      {/* Feedback panel */}
      {currentResult && (
        <div
          className="rounded-card p-4 mb-4"
          style={{
            backgroundColor: currentResult.correct ? '#2FB59A15' : '#FF6B4A15',
            border: `1px solid ${currentResult.correct ? '#2FB59A30' : '#FF6B4A30'}`,
          }}
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
              <p className="font-medium text-sm text-ink">
                {currentResult.correct ? 'Correct!' : 'Not quite right.'}
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
      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-cream/90 backdrop-blur-sm py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-gray-100">
        {/* Hint button */}
        <button
          onClick={() => setShowHint(!showHint)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-white shadow-card text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
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
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-8 sm:max-w-sm z-30">
          <div className="bg-white rounded-card shadow-2xl p-4 flex items-start gap-3">
            <CookieMascot size={40} className="shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted mb-1">Cookie says:</p>
              <p className="text-sm text-ink">{getHint(currentActivity)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Station complete overlay */}
      {stationComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-cream rounded-card shadow-2xl p-8 text-center">
            <Check size={48} className="text-mint mx-auto mb-3" />
            <p className="font-heading font-800 text-xl text-ink">Station Complete!</p>
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

function ReadingTextDisplay({ level, activity, texts }: { level: Level; activity: Activity; texts: ReadingJSON[] }) {
  // Determine which reading text based on the activity prompt
  const text1 = texts[0];
  const text2 = texts[1];
  const isText1 = activity.prompt.includes(text1.title);
  const text = isText1 ? text1 : text2;
  const levelText = text[level];

  return (
    <div className="bg-white rounded-card shadow-card p-6 mb-4">
      <h3 className="font-heading font-700 text-lg text-ink mb-3">{text.title}</h3>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{levelText.text}</p>
    </div>
  );
}

function ListeningAudioDisplay({ activity, level, dialogue }: { activity: Activity; level: Level; dialogue: DialogueJSON }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const payload = activity.payload as any;
  const script: string = payload.audioScript || '';

  // For boss dialogue activities, show the dialogue lines as transcript
  const isDialogue = activity.skill === 'reading' && activity.prompt.includes(`"${dialogue.title}"`);

  return (
    <div className="bg-white rounded-card shadow-card p-6 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <AudioButton
          audioKey={`listen-${activity.id}`}
          fallbackText={script}
          rate={level === 'challenging' ? 1.0 : 0.9}
          label="Listen"
        />
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="px-4 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink hover:bg-gray-50"
          style={{ minHeight: 44 }}
          aria-expanded={showTranscript}
        >
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>
      {showTranscript && (
        <div className="p-3 rounded-card bg-violet/10">
          {isDialogue ? (
            <div className="space-y-1">
              {dialogue.lines.map((line, i) => (
                <p key={i} className="text-sm text-ink">
                  <span className="font-medium text-violet">{line.speaker}:</span> {line.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink italic">{script}</p>
          )}
        </div>
      )}
    </div>
  );
}
