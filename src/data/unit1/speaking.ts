import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type { SpeakingTaskJSON } from './contentPack';

export interface SpeakingTask {
  taskType: string;
  modelLine: string;
  keywords: string[];
  prompt: string;
  hint: string;
  minimumSeconds?: number;
}

function buildTasks(level: Level): SpeakingTask[] {
  const levelData = contentPack.speaking[level];
  return levelData.tasks.map(t => ({
    taskType: t.type,
    modelLine: levelData.model,
    keywords: t.keywords,
    prompt: t.prompt,
    hint: '',
    minimumSeconds: t.minimumSeconds,
  }));
}

export const speakingTasks: Record<Level, SpeakingTask[]> = {
  easy: buildTasks('easy'),
  core: buildTasks('core'),
  challenging: buildTasks('challenging'),
};

export const speakingRubric = contentPack.speaking.rubric;

export type { SpeakingTaskJSON };
