import type { Activity, Level, Skill, ActivityType, VocabItem } from '../../types';
import { contentPack } from './contentPack';

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter++;
  // -u2 suffix keeps activity ids unique across units
  return `${prefix}-u2-${idCounter}`;
}

export function resetIdCounter() {
  idCounter = 0;
}

export function optionCount(level: Level): number {
  const rule = contentPack.differentiationRules[level];
  const parts = rule.options.split('-');
  return parseInt(parts[parts.length - 1], 10);
}

export function maxAttempts(level: Level): number {
  return contentPack.differentiationRules[level].attempts;
}

export function audioReplays(level: Level): number {
  const r = contentPack.differentiationRules[level].audioReplays;
  if (r === 'unlimited') return Infinity;
  return typeof r === 'number' ? r : parseInt(r as string, 10);
}

export function showWordBank(level: Level): boolean {
  return contentPack.differentiationRules[level].wordBank;
}

export function showPictures(level: Level, skill: Skill): boolean {
  const pic = contentPack.differentiationRules[level].picture;
  if (pic === 'always') return true;
  if (pic === 'none') return false;
  if (pic === 'vocabulary only') return skill === 'vocabulary';
  return false;
}

export function xpForSkill(skill: Skill): number {
  const weights: Record<Skill, number> = {
    speaking: 25, vocabulary: 25, listening: 10, reading: 15, writing: 10, grammar: 15,
  };
  const counts: Record<Skill, number> = {
    speaking: 5, vocabulary: 5, listening: 2, reading: 3, writing: 2, grammar: 3,
  };
  return Math.round(weights[skill] / counts[skill]);
}

export function getDistractors(
  correct: VocabItem,
  pool: VocabItem[],
  level: Level,
  count: number,
): VocabItem[] {
  const used = new Set([correct.id]);
  let candidates: VocabItem[];

  const rule = contentPack.differentiationRules[level];

  if (rule.distractors.includes('different word class')) {
    candidates = pool.filter(v => v.category !== correct.category && !used.has(v.id));
    if (candidates.length < count) {
      candidates = pool.filter(v => !used.has(v.id));
    }
  } else if (rule.distractors.includes('same category')) {
    candidates = pool.filter(v => v.category === correct.category && !used.has(v.id));
    if (candidates.length < count) {
      candidates = pool.filter(v => !used.has(v.id));
    }
  } else {
    candidates = pool.filter(v => v.set === correct.set && !used.has(v.id));
    if (candidates.length < count) {
      candidates = pool.filter(v => v.category === correct.category && !used.has(v.id));
    }
    if (candidates.length < count) {
      candidates = pool.filter(v => !used.has(v.id));
    }
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function makeActivity(
  skill: Skill,
  type: ActivityType,
  prompt: string,
  payload: Activity['payload'],
  level: Level,
): Activity {
  return {
    id: nextId(type),
    skill,
    type,
    prompt,
    payload,
    xp: xpForSkill(skill),
    difficulty: level,
  };
}
