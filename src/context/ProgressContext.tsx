import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, ProgressData, Level, StationProgress, LevelProgress } from '../types';
import {
  getProfile, saveProfile, getProgress, saveProgress, clearAll,
  updateStreak, getDefaultProgress,
} from '../lib/storage';

interface ProgressContextValue {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  progress: ProgressData;
  saveStationProgress: (unitId: number, level: Level, stationId: string, stationProgress: StationProgress) => void;
  getStationProgress: (unitId: number, level: Level, stationId: string) => StationProgress | null;
  getLevelProgress: (unitId: number, level: Level) => LevelProgress | null;
  isLevelCompleted: (unitId: number, level: Level) => boolean;
  isCoreCompleted: (unitId: number) => boolean;
  isStationCompleted: (unitId: number, level: Level, stationId: string) => boolean;
  getUnitProgress: (unitId: number) => { completed: number; total: number; xp: number };
  getLevelProgressPercent: (unitId: number, level: Level) => number;
  addLevelHistory: (entry: ProgressData['levelHistory'][0]) => void;
  resetProgress: () => void;
  switchStudent: () => void;
  settings: ProgressData['settings'];
  updateSettings: (s: Partial<ProgressData['settings']>) => void;
  recordVocabCorrect: (vocabId: string) => void;
  getVocabMastery: (vocabId: string) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressData>(getDefaultProgress());

  useEffect(() => {
    const p = getProfile();
    if (p) setProfileState(p);
    const pr = getProgress();
    const updated = updateStreak(pr);
    setProgress(updated);
    saveProgress(updated);
  }, []);

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p);
    saveProfile(p);
  }, []);

  const saveStationProgress = useCallback(
    (unitId: number, level: Level, stationId: string, stationProgress: StationProgress) => {
      setProgress(prev => {
        const unitData = prev.units[unitId] || {};
        const levelData = unitData[level] || { stations: {}, completed: false, stars: 0, bossCompleted: false };

        // Idempotent: only update if not already completed or if new data is better
        const existing = levelData.stations[stationId];
        if (existing && existing.completed && existing.xpEarned >= stationProgress.xpEarned) {
          return prev;
        }

        levelData.stations[stationId] = stationProgress;

        // Recalculate level completion
        const stationCount = 7; // 6 stations + boss
        const completedCount = Object.values(levelData.stations).filter(s => s.completed).length;
        levelData.completed = completedCount >= stationCount;

        unitData[level] = levelData;

        // Recalculate total XP
        let totalXP = 0;
        for (const unit of Object.values(prev.units)) {
          for (const lvl of Object.values(unit)) {
            for (const station of Object.values(lvl.stations)) {
              totalXP += station.xpEarned;
            }
          }
        }

        const newProgress = { ...prev, units: { ...prev.units, [unitId]: unitData }, totalXP };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [],
  );

  const getStationProgress = useCallback(
    (unitId: number, level: Level, stationId: string): StationProgress | null => {
      const unitData = progress.units[unitId];
      if (!unitData) return null;
      const levelData = unitData[level];
      if (!levelData) return null;
      return levelData.stations[stationId] || null;
    },
    [progress],
  );

  const getLevelProgress = useCallback(
    (unitId: number, level: Level): LevelProgress | null => {
      const unitData = progress.units[unitId];
      if (!unitData) return null;
      return unitData[level] || null;
    },
    [progress],
  );

  const isStationCompleted = useCallback(
    (unitId: number, level: Level, stationId: string): boolean => {
      const sp = getStationProgress(unitId, level, stationId);
      return sp?.completed ?? false;
    },
    [getStationProgress],
  );

  const isLevelCompleted = useCallback(
    (unitId: number, level: Level): boolean => {
      const lp = getLevelProgress(unitId, level);
      return lp?.completed ?? false;
    },
    [getLevelProgress],
  );

  const isCoreCompleted = useCallback(
    (unitId: number): boolean => {
      // Core is complete when all 6 stations + boss are done
      const lp = getLevelProgress(unitId, 'core');
      return lp?.completed ?? false;
    },
    [getLevelProgress],
  );

  const getUnitProgress = useCallback(
    (unitId: number) => {
      const unitData = progress.units[unitId];
      if (!unitData) return { completed: 0, total: 21, xp: 0 }; // 3 levels × 7 stations
      let completed = 0;
      let xp = 0;
      let total = 0;
      const levels: Level[] = ['easy', 'core', 'challenging'];
      for (const level of levels) {
        const lp = unitData[level];
        if (lp) {
          completed += Object.values(lp.stations).filter(s => s.completed).length;
          xp += Object.values(lp.stations).reduce((sum, s) => sum + s.xpEarned, 0);
        }
        total += 7; // 7 stations per level
      }
      return { completed, total, xp };
    },
    [progress],
  );

  const getLevelProgressPercent = useCallback(
    (unitId: number, level: Level): number => {
      const lp = getLevelProgress(unitId, level);
      if (!lp) return 0;
      const completed = Object.values(lp.stations).filter(s => s.completed).length;
      return Math.round((completed / 7) * 100);
    },
    [getLevelProgress],
  );

  const addLevelHistory = useCallback(
    (entry: ProgressData['levelHistory'][0]) => {
      setProgress(prev => {
        const newProgress = {
          ...prev,
          levelHistory: [...prev.levelHistory, entry],
        };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [],
  );

  const resetProgress = useCallback(() => {
    clearAll();
    setProfileState(null);
    setProgress(getDefaultProgress());
  }, []);

  const switchStudent = useCallback(() => {
    clearAll();
    setProfileState(null);
    setProgress(getDefaultProgress());
  }, []);

  const updateSettings = useCallback(
    (s: Partial<ProgressData['settings']>) => {
      setProgress(prev => {
        const newProgress = {
          ...prev,
          settings: { ...prev.settings, ...s },
        };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [],
  );

  const recordVocabCorrect = useCallback((vocabId: string) => {
    setProgress(prev => {
      const newMastery = {
        ...prev.vocabMastery,
        [vocabId]: (prev.vocabMastery[vocabId] || 0) + 1,
      };
      const newProgress = { ...prev, vocabMastery: newMastery };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const getVocabMastery = useCallback(
    (vocabId: string): number => {
      return progress.vocabMastery[vocabId] || 0;
    },
    [progress],
  );

  const value: ProgressContextValue = {
    profile,
    setProfile,
    progress,
    saveStationProgress,
    getStationProgress,
    getLevelProgress,
    isLevelCompleted,
    isCoreCompleted,
    isStationCompleted,
    getUnitProgress,
    getLevelProgressPercent,
    addLevelHistory,
    resetProgress,
    switchStudent,
    settings: progress.settings,
    updateSettings,
    recordVocabCorrect,
    getVocabMastery,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
