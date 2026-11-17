// src/lib/pacing.ts
// Single source of truth for every user-facing duration in the app.
// All values are SECONDS unless the identifier says Minutes.

export type Level = 'easy' | 'core' | 'challenging';

/** Relative difficulty weighting. Never change without re-running the auditor. */
export const LEVEL_MULTIPLIER: Record<Level, number> = {
  easy: 0.85,
  core: 1.0,
  challenging: 1.05,
};

/**
 * CALIBRATION — measured, never guessed.
 *
 * Basis: Unit 1 pilot, v2.0 (30 slots + 2 checkpoints), all three levels.
 *   projected  62.0 / 70.8 / 73.8
 *   measured   45   / 49   / 53
 *   ratio      0.726/ 0.692/ 0.718      least-squares fit = 0.711
 *
 * Shipped as 0.72 so Easy clears the 60-minute lesson floor with the teacher frame.
 * Re-fit this single number whenever a new pilot produces fresh measurements.
 */
export const PACING_CALIBRATION = 0.72;

/**
 * Teacher-led minutes around the app: warm-up + closing feedback session.
 * Inferred from the Unit 1 pilot (45-53 min app time reached the 60-75 min target
 * with warm-up and wrap-up). Adjust to your real routine; it only affects one label.
 */
export const TEACHER_FRAME_MINUTES = 15;

interface Timeable {
  estSeconds?: number;
  skill?: string;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * A pack is calibratable only if it carries estSeconds on (almost) every activity.
 * Legacy packs (Units 2 and 3 as shipped at v1.0) do not, and must show NO time label.
 */
export function isCalibratable(activities: Timeable[]): boolean {
  if (activities.length === 0) return false;
  const tagged = activities.filter((a) => typeof a.estSeconds === 'number').length;
  return tagged / activities.length >= 0.8;
}

function splitSeconds(activities: Timeable[]) {
  let content = 0;
  let checkpoints = 0;
  for (const a of activities) {
    if (typeof a.estSeconds !== 'number') continue;
    // Checkpoint slots (CP1, BOSS) carry skill 'mixed'. They are not scaled by
    // the level multiplier: a checkpoint takes the same time at every level.
    if (a.skill === 'mixed') checkpoints += a.estSeconds;
    else content += a.estSeconds;
  }
  return { content, checkpoints };
}

/** Uncalibrated estimate. Internal only — never display this. */
export function rawAppSeconds(activities: Timeable[], level: Level): number {
  if (!isCalibratable(activities)) return 0;
  const { content, checkpoints } = splitSeconds(activities);
  return content * LEVEL_MULTIPLIER[level] + checkpoints;
}

/** Calibrated app time: what the level actually takes. */
export function appSeconds(activities: Timeable[], level: Level): number {
  return rawAppSeconds(activities, level) * PACING_CALIBRATION;
}

export function appMinutes(activities: Timeable[], level: Level): number {
  if (!isCalibratable(activities)) return 0;
  return Math.max(1, Math.round(appSeconds(activities, level) / 60));
}

/** App time plus the teacher frame — the number a teacher plans a lesson around. */
export function lessonMinutes(activities: Timeable[], level: Level): number {
  if (!isCalibratable(activities)) return 0;
  return appMinutes(activities, level) + TEACHER_FRAME_MINUTES;
}

/** Primary label for LevelCard and Quest Map header. Empty string = render nothing. */
export function durationLabel(activities: Timeable[], level: Level): string {
  if (!isCalibratable(activities)) return '';
  return `About ${appMinutes(activities, level)} minutes`;
}

/** Secondary line for the Unit Overview. */
export function lessonLabel(activities: Timeable[], level: Level): string {
  if (!isCalibratable(activities)) return '';
  return `About ${lessonMinutes(activities, level)} minutes with warm-up and wrap-up`;
}
