import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, ProgressData, Level, StationProgress, LevelProgress, ReflectionEntry, ActiveLevelTiming, LevelTiming } from '../types';
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
  /** Ritual layer: persist that the level-start mission brief was shown. */
  markMissionBriefSeen: (unitId: number, level: Level) => void;
  /** Ritual layer: save end-of-station reflection answers. */
  addReflection: (entry: ReflectionEntry) => void;
  /** Timing telemetry: begin a level attempt if one is not under way. */
  startLevelTiming: (unitId: number, level: Level) => void;
  /** Timing telemetry: record one finished station's duration and activity count. */
  recordStationTiming: (unitId: number, level: Level, stationId: string, seconds: number, activities: number) => void;
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

        const wasCompleted = levelData.completed;
        levelData.stations[stationId] = stationProgress;

        // The CP1 milestone is its own Quest Map node; record it as a badge
        // on the level rather than counting it as one of the 7 stations.
        if (stationId === 'checkpoint') {
          levelData.checkpointCompleted = true;
        }

        // Recalculate level completion (checkpoint node excluded)
        const stationCount = 7; // 6 stations + boss
        const completedCount = Object.entries(levelData.stations)
          .filter(([sid, s]) => sid !== 'checkpoint' && s.completed)
          .length;
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

        // Timing telemetry: when the level just completed, finalize the
        // in-flight attempt. localStorage only — never sent anywhere.
        let levelTimings = prev.levelTimings;
        let activeTimings = prev.activeTimings;
        const timingKey = `${unitId}-${level}`;
        if (levelData.completed && !wasCompleted && activeTimings?.[timingKey]) {
          const active: ActiveLevelTiming = activeTimings[timingKey];
          const stations = Object.values(active.perStation);
          const totalSeconds = stations.reduce((sum, s) => sum + s.seconds, 0);
          const totalActivities = stations.reduce((sum, s) => sum + s.activities, 0);
          const timing: LevelTiming = {
            level,
            startedAt: active.startedAt,
            endedAt: Date.now(),
            perStation: active.perStation,
            fastCompletion: totalActivities > 0 && totalSeconds / totalActivities < 25,
          };
          levelTimings = { ...prev.levelTimings, [unitId]: [...(prev.levelTimings?.[unitId] ?? []), timing] };
          const { [timingKey]: _finished, ...rest } = activeTimings;
          activeTimings = rest;
        }

        const newProgress = {
          ...prev,
          units: { ...prev.units, [unitId]: unitData },
          totalXP,
          levelTimings,
          activeTimings,
        };
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
          completed += Object.entries(lp.stations).filter(([sid, s]) => sid !== 'checkpoint' && s.completed).length;
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
      const completed = Object.entries(lp.stations)
        .filter(([sid, s]) => sid !== 'checkpoint' && s.completed)
        .length;
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

  const markMissionBriefSeen = useCallback((unitId: number, level: Level) => {
    setProgress(prev => {
      const unitData = prev.units[unitId] || {};
      const levelData = unitData[level] || { stations: {}, completed: false, stars: 0, bossCompleted: false };
      if (levelData.missionBriefSeen) return prev;
      unitData[level] = { ...levelData, missionBriefSeen: true };
      const newProgress = { ...prev, units: { ...prev.units, [unitId]: unitData } };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const addReflection = useCallback((entry: ReflectionEntry) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        reflections: [...(prev.reflections ?? []), entry],
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const startLevelTiming = useCallback((unitId: number, level: Level) => {
    setProgress(prev => {
      const key = `${unitId}-${level}`;
      if (prev.activeTimings?.[key]) return prev;
      const newProgress = {
        ...prev,
        activeTimings: {
          ...prev.activeTimings,
          [key]: { unitId, level, startedAt: Date.now(), perStation: {} },
        },
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const recordStationTiming = useCallback(
    (unitId: number, level: Level, stationId: string, seconds: number, activities: number) => {
      setProgress(prev => {
        const key = `${unitId}-${level}`;
        const active = prev.activeTimings?.[key];
        if (!active) return prev;
        const newProgress = {
          ...prev,
          activeTimings: {
            ...prev.activeTimings,
            [key]: {
              ...active,
              perStation: { ...active.perStation, [stationId]: { seconds, activities } },
            },
          },
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
    markMissionBriefSeen,
    addReflection,
    startLevelTiming,
    recordStationTiming,
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
