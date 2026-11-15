import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type {
  ReadingJSON,
  ThreadReadingJSON,
  DialogueJSON,
  ReadingQuestionJSON,
  MessageLineJSON,
} from './contentPack';

export type { ReadingJSON, ThreadReadingJSON, DialogueJSON, ReadingQuestionJSON, MessageLineJSON };

// A reading text is either a plain paragraph (hatsAroundTheWorld) or a
// message thread rendered as speaker lines (messageThread).
export type ReadingText = string | MessageLineJSON[];

export interface UnitReadingJSON {
  title: string;
  easy: { text: ReadingText; questions: ReadingQuestionJSON[] };
  core: { text: ReadingText; questions: ReadingQuestionJSON[] };
  challenging: { text: ReadingText; questions: ReadingQuestionJSON[] };
}

export const readings: Record<string, UnitReadingJSON> = {
  messageThread: contentPack.readings.messageThread,
  hatsAroundTheWorld: contentPack.readings.hatsAroundTheWorld,
};

export const readingTexts: UnitReadingJSON[] = [
  contentPack.readings.messageThread,
  contentPack.readings.hatsAroundTheWorld,
];

export const dialogue: DialogueJSON = contentPack.dialogue;

export function dialogueComprehension(level: Level): ReadingQuestionJSON[] {
  return contentPack.dialogue.comprehension[level];
}
