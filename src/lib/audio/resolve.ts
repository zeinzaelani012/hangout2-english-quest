// Manifest lookup and tier selection. The manifest is the single source of
// truth; no component ever hardcodes a filename. Clips are keyed by role +
// normalised text hash — the hash the manifest script computed, resolved here
// by exact text lookup (the manifest ships with the app, so no hashing is
// needed in the client).

import manifestJson from '../../data/audio/manifest.json';
import { normaliseText } from './normalise';

interface ManifestClip {
  hash: string;
  text: string;
  role: string;
  unit: number;
  category: string;
  seconds: null;
}

interface Manifest {
  version: number;
  generated: string;
  voices: Record<string, { role: string; pitch: number }>;
  clips: Record<string, ManifestClip>;
}

const manifest = manifestJson as unknown as Manifest;

const lookupCache = new Map<string, string | null>();
const probeCache = new Map<string, boolean>();

/** The manifest hash for a role + normalised text, or null if unknown. */
export function clipHashFor(role: string, normText: string): string | null {
  const cacheKey = role + '\u0000' + normText;
  const cached = lookupCache.get(cacheKey);
  if (cached !== undefined) return cached;
  let found: string | null = null;
  for (const clip of Object.values(manifest.clips)) {
    if (clip.role === role && clip.text === normText) {
      found = clip.hash;
      break;
    }
  }
  lookupCache.set(cacheKey, found);
  return found;
}

export function rolePitch(role: string): number {
  return manifest.voices[role]?.pitch ?? 1.0;
}

export function manifestClip(hash: string): ManifestClip | null {
  return manifest.clips[hash] ?? null;
}

export function manifestClips(): ManifestClip[] {
  return Object.values(manifest.clips);
}

export function probeFile(hash: string): Promise<boolean> {
  const cached = probeCache.get(hash);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise<boolean>(resolve => {
    const probe = new Audio();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      probeCache.set(hash, ok);
      resolve(ok);
    };
    probe.addEventListener('loadedmetadata', () => done(true));
    probe.addEventListener('error', () => done(false));
    window.setTimeout(() => done(false), 3000);
    probe.src = `/audio/${hash}.mp3`;
    probe.preload = 'metadata';
    probe.load();
  });
}

export interface Resolution {
  tier: 'file' | 'speech';
  hash: string | null;
}

/** Pick the tier for a clip: a rendered file if one exists on disk, else
 * speech synthesis with the chosen voice. Probe results are cached — never
 * probe the same hash twice in a session. */
export async function resolveFor(role: string, normText: string): Promise<Resolution> {
  const hash = clipHashFor(role, normText);
  if (!hash) return { tier: 'speech', hash: null };
  const hasFile = await probeFile(hash);
  return { tier: hasFile ? 'file' : 'speech', hash };
}
