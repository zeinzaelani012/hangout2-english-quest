import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type { ReadingJSON, DialogueJSON, ReadingQuestionJSON } from './contentPack';

export type { ReadingJSON, DialogueJSON, ReadingQuestionJSON };

export const readings: Record<string, ReadingJSON> = {
  outfitDiary: contentPack.readings.outfitDiary,
  uniformsAroundTheWorld: contentPack.readings.uniformsAroundTheWorld,
};

export const readingTexts: ReadingJSON[] = [
  contentPack.readings.outfitDiary,
  contentPack.readings.uniformsAroundTheWorld,
];

export const dialogue: DialogueJSON = contentPack.dialogue;

export function dialogueComprehension(level: Level): ReadingQuestionJSON[] {
  return contentPack.dialogue.comprehension[level];
}
