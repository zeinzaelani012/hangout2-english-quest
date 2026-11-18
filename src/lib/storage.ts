import type { Profile, ProgressData, Level, Skill } from '../types';
import { SKILL_WEIGHTS } from '../types';

const PROFILE_KEY = 'eq.profile';
const PROGRESS_KEY = 'eq.progress';
const SETTINGS_KEY = 'eq.settings';

export function getProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.name || !parsed.avatarId) return null;
    return parsed as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage might be full or disabled
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}

export function getDefaultProgress(): ProgressData {
  return {
    totalXP: 0,
    streak: 0,
    lastVisit: '',
    units: {},
    vocabMastery: {},
    settings: {
      noMicMode: false,
      teacherPin: 'teacher',
      reducedMotion: false,
    },
    levelHistory: [],
    selfAssessments: {},
    selfCheckXP: 0,
    selfCheckXPAwarded: {},
    levelTimings: {},
    activeTimings: {},
  };
}

export function getProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields
    const defaults = getDefaultProgress();
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      units: parsed.units || {},
      vocabMastery: parsed.vocabMastery || {},
      levelHistory: parsed.levelHistory || [],
      selfAssessments: parsed.selfAssessments || {},
      selfCheckXP: parsed.selfCheckXP || 0,
      selfCheckXPAwarded: parsed.selfCheckXPAwarded || {},
      levelTimings: parsed.levelTimings || {},
      activeTimings: parsed.activeTimings || {},
    };
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  clearProfile();
  clearProgress();
}

// Station progress key: unit:{id}:level:{level}:station:{stationId}
export function stationKey(unitId: number, level: Level, stationId: string): string {
  return `unit:${unitId}:level:${level}:station:${stationId}`;
}

// Update streak on visit
export function updateStreak(progress: ProgressData): ProgressData {
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastVisit === today) {
    return progress; // already counted today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (progress.lastVisit === yesterdayStr) {
    newStreak = progress.streak + 1;
  } else if (progress.lastVisit === '') {
    newStreak = 1;
  } else {
    newStreak = 1; // streak broken
  }

  return {
    ...progress,
    streak: newStreak,
    lastVisit: today,
  };
}
