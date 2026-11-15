import type { Unit, Station, Skill, Level, VocabItem } from '../types';
import { SKILL_WEIGHTS } from '../types';
import { contentPack } from './unit1/contentPack';
import type { DialogueJSON } from './unit1/contentPack';
import { vocabulary as unit1Vocabulary } from './unit1/vocabulary';
import { vocabulary as unit2Vocabulary } from './unit2/vocabulary';
import { buildLevelActivities, buildBossLevelActivities } from './unit1/activities';
import { resetIdCounter } from './unit1/factory';
import { readingTexts as unit1ReadingTexts, dialogue as unit1Dialogue } from './unit1/reading';
import { grammarPatterns as unit1Patterns } from './unit1/grammar';
import { buildUnit2 } from './unit2/activities';
import { readingTexts as unit2ReadingTexts, dialogue as unit2Dialogue } from './unit2/reading';
import { grammarPatterns as unit2Patterns } from './unit2/grammar';

const unit1Stations: Station[] = contentPack.stations.map(s => ({
  id: s.id,
  name: s.name,
  skill: (s.skill === 'mixed' ? 'speaking' : s.skill) as Skill,
  order: s.order,
  description: s.note || '',
}));

function buildUnit1(): Unit {
  resetIdCounter();

  const levels: Record<Level, ReturnType<typeof buildLevelActivities>> = {
    easy: buildLevelActivities('easy'),
    core: buildLevelActivities('core'),
    challenging: buildLevelActivities('challenging'),
  };

  return {
    id: 1,
    title: 'Snack Time',
    islandName: 'Snack Island',
    bigQuestion: 'What do you like to eat?',
    objectives: ['Food items', "Saying what you like and don't like"],
    skills: SKILL_WEIGHTS,
    vocabulary: unit1Vocabulary,
    stations: unit1Stations,
    levels,
    bossActivities: {
      easy: buildBossLevelActivities('easy'),
      core: buildBossLevelActivities('core'),
      challenging: buildBossLevelActivities('challenging'),
    },
    unlocked: true,
    status: 'playable',
  };
}

function buildPlaceholderUnit(id: number): Unit {
  return {
    id,
    title: `Unit ${id}`,
    islandName: 'Coming soon',
    bigQuestion: '',
    objectives: [],
    skills: SKILL_WEIGHTS,
    vocabulary: [],
    stations: [],
    levels: { easy: [], core: [], challenging: [] },
    unlocked: false,
    status: 'placeholder',
  };
}

export const units: Unit[] = [
  buildUnit1(),
  buildUnit2(),
  buildPlaceholderUnit(3),
  buildPlaceholderUnit(4),
  buildPlaceholderUnit(5),
  buildPlaceholderUnit(6),
  buildPlaceholderUnit(7),
  buildPlaceholderUnit(8),
  buildPlaceholderUnit(9),
];

export function getUnit(id: number): Unit | undefined {
  return units.find(u => u.id === id);
}

// ---- Per-unit content resolution -------------------------------------------

export interface ReadingMessageLine {
  speaker: string;
  text: string;
}

export interface UnitReadingLevel {
  // Plain paragraph (Unit 1) or a message thread rendered as speaker lines
  text: string | ReadingMessageLine[];
  questions: { q: string; options: string[]; answer: string }[];
}

export interface UnitReading {
  title: string;
  easy: UnitReadingLevel;
  core: UnitReadingLevel;
  challenging: UnitReadingLevel;
}

export interface UnitReadingContext {
  readingTexts: UnitReading[];
  dialogue: DialogueJSON;
}

// Reading and dialogue content is per-unit, so pages resolve it through here
// instead of importing a specific unit's data folder.
export function getUnitReading(unitId: number): UnitReadingContext {
  if (unitId === 2) {
    return { readingTexts: unit2ReadingTexts, dialogue: unit2Dialogue };
  }
  return { readingTexts: unit1ReadingTexts, dialogue: unit1Dialogue };
}

export interface UnitGrammarPattern {
  id: string;
  label: string;
  examples: string[];
  rule?: string;
  note?: string;
}

// The teaching card at the top of the Grammar station, per unit.
export function getUnitGrammarPatterns(unitId: number): UnitGrammarPattern[] {
  if (unitId === 2) return unit2Patterns;
  return unit1Patterns;
}

// ---- Vocabulary Bank --------------------------------------------------------

export interface BankWord extends VocabItem {
  unitId: number;
}

// Every playable unit's words, in unit order.
export const vocabularyBank: BankWord[] = [
  ...unit1Vocabulary.map(v => ({ ...v, unitId: 1 })),
  ...unit2Vocabulary.map(v => ({ ...v, unitId: 2 })),
];

export type { Level } from '../types';
