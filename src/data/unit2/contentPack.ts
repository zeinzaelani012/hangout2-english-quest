import contentPackJson from './hangout2-unit2-content-pack.json';
import type { Level } from '../../types';

export interface VocabItemJSON {
  id: string;
  word: string;
  set: 'A' | 'B' | 'C';
  category: string;
  example: string;
  imgHint: string;
}

export interface WordSortJSON {
  id: string;
  bins: string[];
  items: { word: string; bin: string }[];
}

export interface GrammarGapFillItem {
  id: string;
  sentence: string;
  options: string[];
  answer: string;
  why: string;
}

export interface GrammarPatternJSON {
  id: string;
  label: string;
  examples: string[];
  note?: string;
}

export interface ReadingQuestionJSON {
  q: string;
  options: string[];
  answer: string;
}

export interface MessageLineJSON {
  speaker: string;
  text: string;
}

export interface ReadingLevelJSON {
  text: string;
  questions: ReadingQuestionJSON[];
}

export interface ReadingJSON {
  title: string;
  easy: ReadingLevelJSON;
  core: ReadingLevelJSON;
  challenging: ReadingLevelJSON;
}

// ReadingPassage: a message thread rendered as speaker lines
export interface ThreadReadingLevelJSON {
  text: MessageLineJSON[];
  questions: ReadingQuestionJSON[];
}

export interface ThreadReadingJSON {
  title: string;
  cast: string[];
  easy: ThreadReadingLevelJSON;
  core: ThreadReadingLevelJSON;
  challenging: ThreadReadingLevelJSON;
}

export interface DialogueLineJSON {
  speaker: string;
  text: string;
}

export interface DialogueJSON {
  title: string;
  cast: string[];
  lines: DialogueLineJSON[];
  comprehension: Record<Level, ReadingQuestionJSON[]>;
}

export interface ListeningItemJSON {
  id: string;
  type: 'audioToPicture' | 'audioGap' | 'audioQuestion';
  script: string;
  target?: string;
  options: string[];
  question?: string;
  answer?: string;
}

export interface SpeakingTaskJSON {
  id: string;
  type: string;
  prompt: string;
  keywords: string[];
  minimumSeconds?: number;
}

export interface SpeakingLevelJSON {
  model: string;
  tasks: SpeakingTaskJSON[];
}

export interface WritingEasyJSON {
  type: 'sentenceBuilder';
  items: { id: string; tiles: string[]; answer: string }[];
}

export interface WritingCoreJSON {
  type: 'gapFillDiary';
  template: string;
  options?: string[];
  answer?: string;
  ownSentencesRequired: number;
}

export interface WritingChallengingJSON {
  type: 'diaryPrompt';
  prompt: string;
  checklist: string[];
  minimumWords: number;
}

export interface DifferentiationRule {
  options: string;
  distractors: string;
  picture: string;
  audioReplays: string | number;
  wordBank: boolean;
  attempts: number;
  hint: string;
}

export interface StationMetaJSON {
  id: string;
  order: number;
  skill: string;
  name: string;
  subtitle: string;
  xp: number;
  mechanic?: string;
  unlockAfter?: string[];
}

export interface UnitRegistryEntryJSON {
  id: number;
  title: string;
  islandName: string;
  bigQuestion: string;
  objectives: string[];
  unlocked: boolean;
  status: string;
  note?: string;
}

export interface ContentPack {
  meta: {
    app: string;
    pack: string;
    version: string;
    language: string;
    unit: number;
    title: string;
    islandName: string;
    bigQuestion: string;
    objectives: string[];
    sourcePages: string;
    contentPolicy: string;
    totalUnitsPlanned: number;
    answerKeyIncluded: boolean;
  };
  vocabulary: VocabItemJSON[];
  wordSorts: Record<Level, WordSortJSON[]>;
  grammar: {
    patterns: GrammarPatternJSON[];
    gapFillBank: Record<Level, GrammarGapFillItem[]>;
  };
  readings: { messageThread: ThreadReadingJSON; hatsAroundTheWorld: ReadingJSON };
  dialogue: DialogueJSON;
  listening: Record<Level, ListeningItemJSON[]>;
  speaking: {
    station: string;
    rubric: string[];
    easy: SpeakingLevelJSON;
    core: SpeakingLevelJSON;
    challenging: SpeakingLevelJSON;
  };
  writing: {
    easy: WritingEasyJSON;
    core: WritingCoreJSON;
    challenging: WritingChallengingJSON;
  };
  boss: {
    title: string;
    description: string;
    itemPlan: Record<string, number>;
  };
  stations: StationMetaJSON[];
  unitRegistryEntry: UnitRegistryEntryJSON;
  differentiationRules: Record<Level, DifferentiationRule>;
}

export const contentPack = contentPackJson as ContentPack;
