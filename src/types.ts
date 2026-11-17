export type Skill = 'speaking' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'grammar';
export type Level = 'easy' | 'core' | 'challenging';

// Depth-of-knowledge moves used by the expanded Unit 1 pack (D1 recall … D5 metacognition).
export type DepthMove = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export type ActivityType =
  // Legacy mechanics (Units 2/3)
  | 'pictureMatch'
  | 'dragSort'
  | 'gapFill'
  | 'listenAndDraw'
  | 'recordAndCompare'
  | 'sentenceBuilder'
  | 'stickerPlate'
  | 'diaryPrompt'
  // Expanded Unit 1 pack mechanics (components wire up in later phases)
  | 'pictureToWord'
  | 'wordToPicture'
  | 'audioToWord'
  | 'audioQuestion'
  | 'oddOneOut'
  | 'spelling'
  | 'mixedRecall'
  | 'notice'
  | 'errorCorrection'
  | 'questionForms'
  | 'transform'
  | 'audioToPicture'
  | 'twoPass'
  | 'audioGapFill'
  | 'preReadVocab'
  | 'gist'
  | 'detail'
  | 'findSentence'
  | 'sentenceRepair'
  | 'typeIt'
  | 'guidedParagraph'
  | 'warmUpRepeat'
  | 'chunkDrill'
  | 'askAnswer'
  | 'pictureDescription'
  | 'rolePlay'
  | 'personalResponse'
  | 'monologue'
  | 'checkpoint'
  | 'boss';

export interface VocabItem {
  id: string;
  word: string;
  set: 'A' | 'B' | 'C';
  category: 'snack' | 'healthy' | 'fruit' | 'plant';
  example: string;
  imgHint: string;
}

export interface PictureMatchPayload {
  prompt: string;
  promptAudio: string;
  options: { id: string; label: string; vocabId?: string; imgHint?: string }[];
  answerId: string;
  hint: string;
  why: string;
  audioScript?: string;
}

export interface DragSortPayload {
  prompt: string;
  bins: { id: string; label: string; imgHint: string }[];
  items: { id: string; label: string; binId: string; imgHint: string }[];
  hint: string;
  why: string;
}

export interface GapFillPayload {
  sentence: string; // contains ___ for the blank
  options: string[];
  answer: string;
  hint: string;
  why: string;
  audioScript?: string;
}

export interface ListenAndDrawPayload {
  audioPrompt: string;
  transcript: string;
  tools: { id: string; label: string; color: string }[];
  modelSentence: string;
  hint: string;
}

export interface RecordAndComparePayload {
  modelLine: string;
  keywords: string[];
  contextImage?: string;
  hint: string;
  taskType: string;
  minimumSeconds?: number;
}

export interface SentenceBuilderPayload {
  scrambled: string[];
  answer: string;
  hint: string;
  why: string;
}

export interface StickerPlatePayload {
  prompt: string;
  stickers: { id: string; label: string; imgHint: string }[];
  speakingPrompt: string;
  hint: string;
}

export interface DiaryPromptPayload {
  prompt: string;
  checklist: string[];
  wordBank: string[];
  minLength: number;
  minimumWords?: number;
  hint: string;
}

export type ActivityPayload =
  | PictureMatchPayload
  | DragSortPayload
  | GapFillPayload
  | ListenAndDrawPayload
  | RecordAndComparePayload
  | SentenceBuilderPayload
  | StickerPlatePayload
  | DiaryPromptPayload;

export interface Activity {
  id: string;
  skill: Skill;
  type: ActivityType;
  prompt: string;
  payload: ActivityPayload;
  xp: number;
  /**
   * Base seconds at Core pace. Optional for backward compatibility: legacy
   * packs (Units 2/3) predate the field, so every read must fall back to 60 —
   * use `estSecondsOf` from lib/pacing instead of reading it directly.
   */
  estSeconds?: number;
  /** Depth-of-knowledge moves, e.g. ['D1', 'D5']. */
  depthMoves?: DepthMove[];
  /** Pack schema version. 2 = expanded pack mechanics; absent = legacy. */
  schema?: 2;
  difficulty: Level;
}

export interface Station {
  id: string;
  name: string;
  skill: Skill;
  order: number;
  description: string;
}

export interface Unit {
  id: number;
  title: string;
  islandName: string;
  bigQuestion: string;
  objectives: string[];
  skills: Record<Skill, number>;
  vocabulary: VocabItem[];
  levels: Record<Level, Activity[]>;
  stations: Station[];
  unlocked: boolean;
  status: 'playable' | 'placeholder';
  bossActivities?: Record<Level, Activity[]>;
}

export const SKILL_WEIGHTS: Record<Skill, number> = {
  speaking: 25,
  vocabulary: 25,
  listening: 10,
  reading: 15,
  writing: 10,
  grammar: 15,
};

export const ACTIVITY_COUNTS: Record<Skill, number> = {
  speaking: 5,
  vocabulary: 5,
  listening: 2,
  reading: 3,
  writing: 2,
  grammar: 3,
};

export const SKILL_COLORS: Record<Skill, string> = {
  speaking: '#F05A47',
  vocabulary: '#D89B24',
  listening: '#6657C8',
  reading: '#168A72',
  writing: '#9B5CC4',
  grammar: '#53708A',
};

export const SKILL_LABELS: Record<Skill, string> = {
  speaking: 'Speaking',
  vocabulary: 'Vocabulary',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  grammar: 'Grammar',
};

export const LEVEL_LABELS: Record<Level, string> = {
  easy: 'Easy',
  core: 'Core',
  challenging: 'Challenging',
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  easy: 'Take it slow',
  core: 'On level',
  challenging: 'Push yourself',
};

export const SKILL_ICONS: Record<Skill, string> = {
  speaking: 'mic',
  vocabulary: 'book-open',
  listening: 'ear',
  reading: 'book-marked',
  writing: 'pen-line',
  grammar: 'wrench',
};

export interface Profile {
  name: string;
  avatarId: string;
  createdAt: string;
}

export interface StationProgress {
  completed: boolean;
  xpEarned: number;
  attempts: Record<string, boolean>;
  errors: { activityId: string; correctAnswer: string; rule: string }[];
}

export interface LevelProgress {
  stations: Record<string, StationProgress>;
  completed: boolean;
  stars: number;
  bossCompleted: boolean;
  /** Ritual layer: the level-start mission brief has been shown. */
  missionBriefSeen?: boolean;
  /** The CP1 milestone node between Grammar and Listening has been earned. */
  checkpointCompleted?: boolean;
}

/** End-of-station reflection answers (ritual layer). */
export interface ReflectionEntry {
  unitId: number;
  level: Level;
  stationId: string;
  date: string;
  answers: string[];
}

/**
 * Timing telemetry for one completed level attempt. localStorage only —
 * never sent anywhere.
 */
export interface LevelTiming {
  level: Level;
  startedAt: number;
  endedAt: number;
  perStation: Record<string, { seconds: number; activities: number }>;
  /** true when average < 25 seconds per activity */
  fastCompletion: boolean;
}

/** In-flight timing while a level attempt is under way. */
export interface ActiveLevelTiming {
  unitId: number;
  level: Level;
  startedAt: number;
  perStation: Record<string, { seconds: number; activities: number }>;
}

export interface ProgressData {
  totalXP: number;
  streak: number;
  lastVisit: string;
  units: Record<number, Record<Level, LevelProgress>>;
  vocabMastery: Record<string, number>; // vocabId -> correct count
  settings: {
    noMicMode: boolean;
    teacherPin: string;
    reducedMotion: boolean;
  };
  levelHistory: { unitId: number; level: Level; stars: number; date: string; accuracy: number }[];
  reflections?: ReflectionEntry[];
  /** Completed level attempts, grouped by unit. */
  levelTimings?: Record<number, LevelTiming[]>;
  /** In-flight level attempts, keyed by `${unitId}-${level}`. */
  activeTimings?: Record<string, ActiveLevelTiming>;
}
