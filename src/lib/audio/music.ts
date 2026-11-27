// Ambient background music — user-supplied instrumental tracks shipped in
// /public/music/. Device-scoped like the voice settings: a toggle and a
// volume in `h2eq.audio.v1`.
//
// Routing rules (the pedagogical part):
//   - Never on listening/speaking stations, checkpoints, bosses or any
//     capstone surface — music must not compete with lesson audio or an
//     assessment.
//   - "focus" plays only on the quiet practice stations.
//   - One mood per surface elsewhere: hub (home), hopeful (browsing),
//     celebratory (results), proud (certificate).
//   - Speech ducks the music (see duckMusic, called from the public play()).
//
// Files are fetched on demand (preload = 'none'), never precached — 7 MB of
// music on first load would be hostile on school wifi.

import { loadAudioSettings, onAudioSettingsChange } from './settings';

export type MusicTrackId = 'hub' | 'focus' | 'celebratory' | 'proud' | 'hopeful';

const TRACKS: Record<MusicTrackId, string> = {
  hub: '/music/hub.mp3',
  focus: '/music/focus.mp3',
  celebratory: '/music/celebratory.mp3',
  proud: '/music/proud.mp3',
  hopeful: '/music/hopeful.mp3',
};

/** Stations where music would fight the lesson audio or an assessment. */
const QUIET_STATIONS = new Set(['listening', 'speaking', 'checkpoint', 'boss', 'self-check']);

/** The track a route should play, or null for silence. */
export function trackForRoute(pathname: string): MusicTrackId | null {
  if (pathname === '/') return 'hub';
  if (pathname.startsWith('/teacher')) return null;
  if (pathname.startsWith('/results')) return 'celebratory';
  if (pathname.startsWith('/capstone')) {
    if (pathname.startsWith('/capstone/final-gate/results') || pathname.startsWith('/capstone/certificate')) return 'proud';
    if (pathname.startsWith('/capstone/station') || pathname.startsWith('/capstone/final-gate')) return null;
    return 'hopeful';
  }
  const parts = pathname.split('/').filter(Boolean); // unit/:unitId/:level/:stationId?
  if (parts[0] === 'unit') {
    if (parts[3] && QUIET_STATIONS.has(parts[3])) return null;
    return parts[3] ? 'focus' : 'hopeful';
  }
  if (
    pathname.startsWith('/vocabulary') ||
    pathname.startsWith('/progress') ||
    pathname.startsWith('/settings')
  ) {
    return 'hopeful';
  }
  return null;
}

let el: HTMLAudioElement | null = null;
let current: MusicTrackId | null = null;
/** Autoplay was blocked; this track starts on the next user gesture. */
let waiting: MusicTrackId | null = null;
let lastPathname = '/';
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
/** Bumped on every start/stop so a stale fade callback can never act. */
let token = 0;
let ducked = false;

function desiredVolume(): number {
  const { musicEnabled, musicVolume } = loadAudioSettings();
  if (!musicEnabled) return 0;
  const volume = Math.max(0, Math.min(1, musicVolume));
  return ducked ? volume * 0.35 : volume;
}

function cancelFade(): void {
  if (fadeTimer !== null) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }
}

/** Snap to the current setting. Used while the user is dragging the slider. */
function applyLiveVolume(): void {
  if (!el) return;
  cancelFade();
  el.volume = desiredVolume();
}

function element(): HTMLAudioElement {
  if (el) return el;
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  // Attached but invisible — some Safari builds are unreliable with
  // fully detached media elements, and it keeps the element inspectable.
  audio.setAttribute('aria-hidden', 'true');
  document.body.appendChild(audio);
  el = audio;
  return audio;
}

/** setTimeout-driven (not rAF) so a throttled background tab still finishes. */
function fade(to: number, ms: number, done?: () => void): void {
  const audio = el;
  if (!audio) {
    done?.();
    return;
  }
  cancelFade();
  const from = audio.volume;
  const t0 = performance.now();
  const step = () => {
    if (el !== audio) {
      done?.();
      return;
    }
    const k = Math.min(1, (performance.now() - t0) / ms);
    audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) {
      fadeTimer = setTimeout(step, 50);
    } else {
      fadeTimer = null;
      done?.();
    }
  };
  fadeTimer = setTimeout(step, 50);
}

function start(track: MusicTrackId): void {
  const audio = element();
  const myToken = ++token;
  waiting = null;
  const swap = () => {
    if (myToken !== token) return;
    audio.src = TRACKS[track];
    current = track;
    audio.volume = 0;
    audio.play().then(() => {
      if (myToken !== token) return;
      fade(desiredVolume(), 800);
    }).catch(() => {
      // Autoplay is blocked until a gesture — retry on the next interaction.
      if (myToken !== token) return;
      current = null;
      waiting = track;
    });
  };
  if (current === null || audio.paused) {
    swap();
  } else {
    fade(0, 250, () => {
      if (myToken !== token) return;
      audio.pause();
      swap();
    });
  }
}

/** Fade the current track out and stop. Safe to call repeatedly. */
export function stopMusic(): void {
  token++;
  waiting = null;
  const audio = el;
  if (!audio || current === null) return;
  const wasCurrent = current;
  current = null;
  fade(0, 250, () => {
    if (audio === el && current === null && wasCurrent !== null) audio.pause();
  });
}

/** Bring the route's track (or silence) into effect. Called on every navigation. */
export function syncMusicForRoute(pathname: string): void {
  lastPathname = pathname;
  const settings = loadAudioSettings();
  const track = settings.musicEnabled ? trackForRoute(pathname) : null;
  if (track === null) {
    stopMusic();
    return;
  }
  if (track === current && el && !el.paused) return;
  start(track);
}

/** Dip the music while lesson speech plays, restore it afterwards. */
export function duckMusic(on: boolean): void {
  if (on === ducked) return;
  ducked = on;
  if (!el || current === null || el.paused) return;
  fade(desiredVolume(), 200);
}

if (typeof window !== 'undefined') {
  // Toggle/volume changes made in Settings take effect immediately.
  onAudioSettingsChange(() => {
    const settings = loadAudioSettings();
    if (!settings.musicEnabled) {
      stopMusic();
      return;
    }
    if (el && current && !el.paused) {
      applyLiveVolume();
    } else {
      syncMusicForRoute(lastPathname);
    }
  });

  // Pause while the tab is hidden; resume where the track left off.
  document.addEventListener('visibilitychange', () => {
    const audio = el;
    if (!audio || current === null) return;
    if (document.hidden) {
      audio.pause();
    } else if (loadAudioSettings().musicEnabled) {
      applyLiveVolume();
      void audio.play().catch(() => {});
    }
  });

  // First play on a cold load is gesture-gated; the blocked track starts here.
  window.addEventListener('pointerdown', () => {
    if (waiting !== null && loadAudioSettings().musicEnabled) start(waiting);
  }, { passive: true });
}
