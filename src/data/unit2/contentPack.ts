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

export interface GrammarGapFillItem {
  id: string;
  sentence: string;
  options: string[];
  answer: string;
  why: string;
}

export interface ReadingQuestionJSON {
  q: string;
  options: string[];
  answer: string;
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

export interface UnitMetaJSON {
  id: number;
  title: string;
  islandName: string;
  bigQuestion?: string;
  objectives?: string[];
  unlocked: boolean;
  status: string;
}

export interface StationMetaJSON {
  id: string;
  order: number;
  name: string;
  skill: string;
  xp: number;
  note?: string;
}

export interface ContentPack {
  meta: {
    app: string;
    version: string;
    language: string;
    audienceAges: string;
    contentPolicy: string;
    unitCovered: number;
    totalUnitsPlanned: number;
    answerKeyIncluded: boolean;
  };
  vocabulary: VocabItemJSON[];
  grammar: {
    patterns: { id: string; label: string; examples: string[]; rule?: string }[];
    gapFillBank: Record<Level, GrammarGapFillItem[]>;
  };
  readings: { outfitDiary: ReadingJSON; uniformsAroundTheWorld: ReadingJSON };
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
  differentiationRules: Record<Level, DifferentiationRule>;
  units: UnitMetaJSON[];
  stations: StationMetaJSON[];
}

export const contentPack = contentPackJson as ContentPack;
