import type { Unit, Station, Skill, Level, VocabItem, Activity } from '../types';
import { SKILL_WEIGHTS } from '../types';
import { contentPack } from './unit1/contentPack';
import type { DialogueJSON } from './unit1/contentPack';
import { vocabulary as unit1Vocabulary } from './unit1/vocabulary';
import { buildLevel as buildUnit1V2Level, unit1Ritual, type PackRitual } from './unit1/v2';
import { readingTexts as unit1ReadingTexts, dialogue as unit1Dialogue } from './unit1/reading';
import { grammarPatterns as unit1Patterns } from './unit1/grammar';
import {
  buildLevel as buildUnit2V2Level,
  unit2Registry,
  unit2Stations,
  unit2Dialogue,
  unit2Phonics,
  vocabulary as unit2Vocabulary,
  type UnitPhonics,
} from './unit2/v2';
import {
  buildLevel as buildUnit3V2Level,
  unit3Registry,
  unit3Stations,
  unit3Dialogue,
  unit3Phonics,
  vocabulary as unit3Vocabulary,
} from './unit3/v2';
import {
  buildLevel as buildUnit4V2Level,
  unit4Registry,
  unit4Stations,
  unit4Dialogue,
  unit4Phonics,
  unit4Ritual,
  vocabulary as unit4Vocabulary,
} from './unit4/v2';
import {
  buildLevel as buildUnit5V2Level,
  unit5Registry,
  unit5Stations,
  unit5Dialogue,
  unit5Phonics,
  vocabulary as unit5Vocabulary,
} from './unit5/v2';

const unit1Stations: Station[] = contentPack.stations.map(s => ({
  id: s.id,
  name: s.name,
  skill: (s.skill === 'mixed' ? 'speaking' : s.skill) as Skill,
  order: s.order,
  description: s.note || '',
}));

// CP1/BOSS are checkpoint slots on the level's timeline; the app routes them
// through the boss station like the old boss activities.
function isCheckpointActivity(a: Activity): boolean {
  return a.type === 'checkpoint' || a.type === 'boss';
}

/** Ritual layer content for a unit (mission brief, teach cards, reflection). */
export function getUnitRitual(unitId: number): PackRitual | undefined {
  if (unitId === 1) return unit1Ritual;
  if (unitId === 4) return unit4Ritual;
  return undefined;
}

function buildUnit3(): Unit {
  const all: Record<Level, Activity[]> = {
    easy: buildUnit3V2Level('easy'),
    core: buildUnit3V2Level('core'),
    challenging: buildUnit3V2Level('challenging'),
  };

  // Identity comes from the pack's own unitRegistryEntry block.
  return {
    id: unit3Registry.id,
    title: unit3Registry.title,
    islandName: unit3Registry.islandName,
    bigQuestion: unit3Registry.bigQuestion,
    objectives: unit3Registry.objectives,
    skills: SKILL_WEIGHTS,
    vocabulary: unit3Vocabulary,
    stations: unit3Stations,
    levels: {
      easy: all.easy.filter(a => !isCheckpointActivity(a)),
      core: all.core.filter(a => !isCheckpointActivity(a)),
      challenging: all.challenging.filter(a => !isCheckpointActivity(a)),
    },
    bossActivities: {
      easy: all.easy.filter(isCheckpointActivity),
      core: all.core.filter(isCheckpointActivity),
      challenging: all.challenging.filter(isCheckpointActivity),
    },
    unlocked: unit3Registry.unlocked,
    status: unit3Registry.status,
  };
}

function buildUnit4(): Unit {
  const all: Record<Level, Activity[]> = {
    easy: buildUnit4V2Level('easy'),
    core: buildUnit4V2Level('core'),
    challenging: buildUnit4V2Level('challenging'),
  };

  return {
    id: unit4Registry.id,
    title: unit4Registry.title,
    islandName: unit4Registry.islandName,
    bigQuestion: unit4Registry.bigQuestion,
    objectives: unit4Registry.objectives,
    skills: SKILL_WEIGHTS,
    vocabulary: unit4Vocabulary,
    stations: unit4Stations,
    levels: {
      easy: all.easy.filter(a => !isCheckpointActivity(a)),
      core: all.core.filter(a => !isCheckpointActivity(a)),
      challenging: all.challenging.filter(a => !isCheckpointActivity(a)),
    },
    bossActivities: {
      easy: all.easy.filter(isCheckpointActivity),
      core: all.core.filter(isCheckpointActivity),
      challenging: all.challenging.filter(isCheckpointActivity),
    },
    unlocked: unit4Registry.unlocked,
    status: unit4Registry.status,
  };
}

function buildUnit5(): Unit {
  const all: Record<Level, Activity[]> = {
    easy: buildUnit5V2Level('easy'),
    core: buildUnit5V2Level('core'),
    challenging: buildUnit5V2Level('challenging'),
  };

  return {
    id: unit5Registry.id,
    title: unit5Registry.title,
    islandName: unit5Registry.islandName,
    bigQuestion: unit5Registry.bigQuestion,
    objectives: unit5Registry.objectives,
    skills: SKILL_WEIGHTS,
    vocabulary: unit5Vocabulary,
    stations: unit5Stations,
    levels: {
      easy: all.easy.filter(a => !isCheckpointActivity(a)),
      core: all.core.filter(a => !isCheckpointActivity(a)),
      challenging: all.challenging.filter(a => !isCheckpointActivity(a)),
    },
    bossActivities: {
      easy: all.easy.filter(isCheckpointActivity),
      core: all.core.filter(isCheckpointActivity),
      challenging: all.challenging.filter(isCheckpointActivity),
    },
    unlocked: unit5Registry.unlocked,
    status: unit5Registry.status,
  };
}

function buildUnit2(): Unit {
  const all: Record<Level, Activity[]> = {
    easy: buildUnit2V2Level('easy'),
    core: buildUnit2V2Level('core'),
    challenging: buildUnit2V2Level('challenging'),
  };

  // Identity comes from the pack's own unitRegistryEntry block.
  return {
    id: unit2Registry.id,
    title: unit2Registry.title,
    islandName: unit2Registry.islandName,
    bigQuestion: unit2Registry.bigQuestion,
    objectives: unit2Registry.objectives,
    skills: SKILL_WEIGHTS,
    vocabulary: unit2Vocabulary,
    stations: unit2Stations,
    levels: {
      easy: all.easy.filter(a => !isCheckpointActivity(a)),
      core: all.core.filter(a => !isCheckpointActivity(a)),
      challenging: all.challenging.filter(a => !isCheckpointActivity(a)),
    },
    bossActivities: {
      easy: all.easy.filter(isCheckpointActivity),
      core: all.core.filter(isCheckpointActivity),
      challenging: all.challenging.filter(isCheckpointActivity),
    },
    unlocked: unit2Registry.unlocked,
    status: unit2Registry.status,
  };
}

function buildUnit1(): Unit {
  const all: Record<Level, Activity[]> = {
    easy: buildUnit1V2Level('easy'),
    core: buildUnit1V2Level('core'),
    challenging: buildUnit1V2Level('challenging'),
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
    levels: {
      easy: all.easy.filter(a => !isCheckpointActivity(a)),
      core: all.core.filter(a => !isCheckpointActivity(a)),
      challenging: all.challenging.filter(a => !isCheckpointActivity(a)),
    },
    bossActivities: {
      easy: all.easy.filter(isCheckpointActivity),
      core: all.core.filter(isCheckpointActivity),
      challenging: all.challenging.filter(isCheckpointActivity),
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
  buildUnit3(),
  buildUnit4(),
  buildUnit5(),
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
// instead of importing a specific unit's data folder. Expanded packs carry
// their content inline (Unit 2's readings live on the R2/R3/R4 slots), so a
// v2 unit only needs its dialogue for the role-play source.
export function getUnitReading(unitId: number): UnitReadingContext {
  if (unitId === 2) {
    return { readingTexts: [], dialogue: unit2Dialogue };
  }
  if (unitId === 3) {
    return { readingTexts: [], dialogue: unit3Dialogue };
  }
  if (unitId === 4) {
    return { readingTexts: [], dialogue: unit4Dialogue };
  }
  if (unitId === 5) {
    return { readingTexts: [], dialogue: unit5Dialogue };
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

// The teaching card at the top of the Grammar station, per unit. Expanded
// packs carry their grammar teaching on the G1 slot's teachCard instead, so
// only Unit 1 has patterns here.
export function getUnitGrammarPatterns(unitId: number): UnitGrammarPattern[] {
  if (unitId === 2) return [];
  return unit1Patterns;
}

/** Optional pronunciation card data (U2 th/s; U3 ch/sh/th; U4 s/sh; U5 r/l). */
export function getUnitPhonics(unitId: number): UnitPhonics | undefined {
  if (unitId === 2) return unit2Phonics;
  if (unitId === 3) return unit3Phonics;
  if (unitId === 4) return unit4Phonics;
  if (unitId === 5) return unit5Phonics;
  return undefined;
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
