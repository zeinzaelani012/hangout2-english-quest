// Which clips were pre-rendered, and by whose voice. scripts/render-audio.mjs
// rewrites this file as it renders; empty clips means every station runs on
// Tier 0 (the chosen speechSynthesis voice) alone.

import infoJson from '../../data/audio/render-info.json';
import { manifestClips } from './resolve';

export interface RenderInfoEntry {
  provider: string;
  voiceId: string;
  voiceName: string;
  renderedAt: string;
}

interface RenderInfo {
  generated: string | null;
  provider: string | null;
  clips: Record<string, RenderInfoEntry>;
}

const info = infoJson as unknown as RenderInfo;

export function renderInfoForHash(hash: string): RenderInfoEntry | null {
  return info.clips[hash] ?? null;
}

/** First render voice used for a unit's clips, or null when the unit has no
 * rendered files (the picker shows nothing rather than a stale name). */
export function renderedVoiceForUnit(unit?: number): { voiceName: string; provider: string; count: number } | null {
  let count = 0;
  let first: RenderInfoEntry | null = null;
  for (const clip of manifestClips()) {
    if (unit !== undefined && clip.unit !== unit) continue;
    const entry = info.clips[clip.hash];
    if (entry) {
      count++;
      if (!first) first = entry;
    }
  }
  return first ? { voiceName: first.voiceName, provider: first.provider, count } : null;
}
