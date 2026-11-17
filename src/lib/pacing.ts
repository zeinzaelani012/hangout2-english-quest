import type { Activity, Level } from '../types';

/**
 * Level pacing engine (expanded Unit 1 pack, meta.pacing).
 *
 * estSeconds is optional on Activity: legacy packs (Units 2/3) predate the
 * field, so EVERY read goes through estSecondsOf, which falls back to 60.
 */

export const LEVEL_MULTIPLIER: Record<Level, number> = {
  easy: 0.85,
  core: 1.0,
  challenging: 1.05,
};

export const CHECKPOINT_SECONDS = {
  mid: 300,
  boss: 420,
} as const;

const DEFAULT_EST_SECONDS = 60;

/** Base seconds at Core pace; falls back to 60 when the pack omits it. */
export function estSecondsOf(activity: Activity): number {
  return activity.estSeconds ?? DEFAULT_EST_SECONDS;
}

function isCheckpoint(activity: Activity): boolean {
  return activity.type === 'checkpoint' || activity.type === 'boss';
}

/**
 * Projected minutes for a level: (sum of content estSeconds × level multiplier
 * + the two fixed checkpoints) / 60. Checkpoint/boss slots are excluded from
 * the sum because their 300 + 420 seconds are the added constant.
 */
export function projectedMinutes(activities: Activity[], level: Level): number {
  const contentSeconds = activities
    .filter(a => !isCheckpoint(a))
    .reduce((sum, a) => sum + estSecondsOf(a), 0);
  const checkpoints = CHECKPOINT_SECONDS.mid + CHECKPOINT_SECONDS.boss;
  return Math.round((contentSeconds * LEVEL_MULTIPLIER[level] + checkpoints) / 60);
}
