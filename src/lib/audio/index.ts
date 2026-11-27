// Public audio API. Every station uses this and nothing else.

import type { Level } from '../../types';

export type AudioRole = 'narrator' | 'ana' | 'ben' | 'brian' | 'mia' | 'lina';

import { resolveFor, probeFile, manifestClip, manifestClips } from './resolve';
import { speak, cancelSpeech, isSpeechSpeaking } from './speak';
import { playFile, stopFiles, preloadFile } from './player';
import { loadAudioSettings, saveAudioSettings, onAudioSettingsChange } from './settings';
import { syncMusicForRoute, stopMusic, trackForRoute, duckMusic } from './music';
import { installUiSoundUnlock, playUiSound, type UiSoundCue } from './uiSounds';
import {
  getVoicesList, onVoicesChanged, groupVoices, vendorOf, isNeural, isEnglish,
  languageName, pickDefaultVoice, resolveVoice,
} from './voices';

export interface PlayOptions {
  /** Speaker role — content refers to roles, never to voices. */
  role?: AudioRole;
  /** Level, for the rate multiplier (Easy 0.90 / Core 1.00 / Challenging 1.05). */
  level?: Level;
  /** Explicit rate override — wins over the level multiplier. */
  rate?: number;
  /** Pitch override for dialogue characters. */
  pitch?: number;
}

// Level rate multipliers (Part E) — stored per level, one setting serves all.
const LEVEL_RATE: Record<Level, number> = { easy: 0.9, core: 1.0, challenging: 1.05 };

/** The rate multiplier a level adds, for callers that preview at lesson speed. */
export function levelRateMultiplier(level: Level): number {
  return LEVEL_RATE[level] ?? 1.0;
}

/**
 * Picker preview: speak this text with an EXACT voice, bypassing tier
 * resolution — the picker must demonstrate the chosen voice even where a
 * rendered file exists. Stops any other playback first (one preview at a
 * time), so overlapping speech is impossible.
 */
export function previewVoice(
  voice: SpeechSynthesisVoice,
  text: string,
  rateMultiplier = 1,
): Promise<void> {
  stop();
  return speak(text, { voice, rate: rateMultiplier, volume: loadAudioSettings().volume });
}

// Character pitch offsets from the manifest voices block.
const ROLE_PITCH: Record<string, number> = { ana: 1.12, ben: 0.94, brian: 0.96, mia: 1.1, lina: 1.06 };

let currentPlayId = 0;

function voiceFor(role: AudioRole): { voice: SpeechSynthesisVoice | null; pitch: number | null } {
  const settings = loadAudioSettings();
  const voices = getVoicesList();
  const saved = resolveVoice(settings.voiceURI, voices);
  const chosen = saved ?? pickDefaultVoice(voices);

  if (settings.characterVoices && settings.characterVoiceURI) {
    const charVoice = resolveVoice(settings.characterVoiceURI, voices);
    if (charVoice) return { voice: charVoice, pitch: null };
    // Character voice missing — one chosen voice with pitch offsets.
    return { voice: chosen, pitch: ROLE_PITCH[role] ?? 1.0 };
  }
  // Dialogue characters differ by pitch; the narrator runs everything else.
  return { voice: chosen, pitch: role !== 'narrator' ? ROLE_PITCH[role] ?? 1.0 : null };
}

function effectiveVolume(): number {
  return loadAudioSettings().volume;
}

/**
 * Speak/play a script. Resolves when playback ends; rejects on failure so
 * callers can show a "Play again" control. Resolution order: human recording
 * (Tier 2) → rendered file (Tier 1) → speechSynthesis with the chosen voice
 * (Tier 0).
 */
export function play(text: string, opts: PlayOptions = {}): Promise<void> {
  const role = (opts.role ?? 'narrator') as AudioRole;
  const norm = text.trim().replace(/\s+/g, ' ');
  const thisPlay = ++currentPlayId;
  const volume = effectiveVolume();
  duckMusic(true);

  return resolveFor(role, norm).then(resolution => {
    if (thisPlay !== currentPlayId) return; // superseded by a newer play or stop
    if (resolution.tier === 'file' && resolution.hash) {
      return playFile(resolution.hash, volume);
    }
    const { voice, pitch } = voiceFor(role);
    const levelRate = opts.level ? LEVEL_RATE[opts.level] ?? 1.0 : 1.0;
    const rolePitch = role !== 'narrator' ? ROLE_PITCH[role] ?? 1.0 : 1.0;
    // speak() multiplies by the user's settings.rate itself — don't double it.
    return speak(norm, {
      voice,
      rate: opts.rate ?? levelRate * rolePitch,
      volume,
      pitch: opts.pitch ?? pitch ?? 1.0,
    });
  }).finally(() => {
    if (thisPlay === currentPlayId) duckMusic(false);
  });
}

/** Play a specific manifest clip by hash. */
export async function playClip(hash: string): Promise<void> {
  const clip = manifestClip(hash);
  if (!clip) throw new Error(`unknown clip: ${hash}`);
  return play(clip.text, { role: clip.role as AudioRole });
}

/** Fire-and-forget preload of the Tier 1/2 file for this script, if any. */
export function preload(text: string, opts: PlayOptions = {}): void {
  const role = (opts.role ?? 'narrator') as AudioRole;
  const norm = text.trim().replace(/\s+/g, ' ');
  void resolveFor(role, norm).then(res => {
    if (res.tier === 'file' && res.hash) preloadFile(res.hash);
  });
}

/** Stop everything, immediately — utterances, files, everything. */
export function stop(): void {
  currentPlayId++;
  cancelSpeech();
  stopFiles();
  duckMusic(false);
}

export function isSpeaking(): boolean {
  return isSpeechSpeaking();
}

/** Called on every route change so audio never bleeds into the next station. */
export function stopOnRouteChange(): void {
  stop();
}

/** Which tiers this device/session can currently use. Tier 1 becomes true
 * once rendered files exist (verify-audio fills manifest seconds). */
export function available(): { tier0: boolean; tier1: boolean } {
  const tier0 = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const tier1 = manifestClips().some(c => c.seconds !== null);
  return { tier0, tier1 };
}

export {
  getVoicesList,
  onVoicesChanged,
  groupVoices,
  vendorOf,
  isNeural,
  isEnglish,
  languageName,
  pickDefaultVoice,
  resolveVoice,
  loadAudioSettings,
  saveAudioSettings,
  onAudioSettingsChange,
  syncMusicForRoute,
  stopMusic,
  trackForRoute,
  installUiSoundUnlock,
  playUiSound,
};
export type { VoiceGroup } from './voices';
export type { MusicTrackId } from './music';
export type { UiSoundCue } from './uiSounds';
