import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type { ReadingJSON, DialogueJSON, ReadingQuestionJSON } from './contentPack';

export type { ReadingJSON, DialogueJSON, ReadingQuestionJSON };

export const readings: Record<string, ReadingJSON> = {
  snackDiary: contentPack.readings.snackDiary,
  whereFruitGrows: contentPack.readings.whereFruitGrows,
};

export const readingTexts: ReadingJSON[] = [
  contentPack.readings.snackDiary,
  contentPack.readings.whereFruitGrows,
];

export const dialogue: DialogueJSON = contentPack.dialogue;

export function dialogueComprehension(level: Level): ReadingQuestionJSON[] {
  return contentPack.dialogue.comprehension[level];
}
