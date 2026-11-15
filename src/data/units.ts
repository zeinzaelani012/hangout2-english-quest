import type { Unit, Station, Skill, Level } from '../types';
import { SKILL_WEIGHTS } from '../types';
import { contentPack } from './unit1/contentPack';
import type { ReadingJSON, DialogueJSON } from './unit1/contentPack';
import { vocabulary } from './unit1/vocabulary';
import { buildLevelActivities, buildBossLevelActivities } from './unit1/activities';
import { resetIdCounter } from './unit1/factory';
import { readingTexts as unit1ReadingTexts, dialogue as unit1Dialogue } from './unit1/reading';
import { buildUnit2 } from './unit2/activities';
import { readingTexts as unit2ReadingTexts, dialogue as unit2Dialogue } from './unit2/reading';

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
    vocabulary,
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

export interface UnitReadingContext {
  readingTexts: ReadingJSON[];
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

export { vocabulary } from './unit1/vocabulary';
export type { Level } from '../types';
