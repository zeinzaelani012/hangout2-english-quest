// Tier 1/2 — HTMLAudioElement pool for rendered files and human recordings,
// keyed by the same role+text hash as the manifest. Probe results are cached
// in memory — never probe the same hash twice in a session.

const probeCache = new Map<string, boolean>();
const pool = new Map<string, HTMLAudioElement>();

let current: HTMLAudioElement | null = null;

export function probeFile(hash: string): Promise<boolean> {
  const cached = probeCache.get(hash);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise(resolve => {
    const url = `/audio/${hash}.mp3`;
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
    probe.src = url;
    probe.preload = 'metadata';
    probe.load();
  });
}

/** Play a rendered file. Resolves when playback ends; rejects on failure. */
export function playFile(hash: string, volume: number): Promise<void> {
  stopFiles();
  let el = pool.get(hash);
  if (!el) {
    el = new Audio(`/audio/${hash}.mp3`);
    pool.set(hash, el);
  }
  el.volume = Math.max(0, Math.min(1, volume));
  el.currentTime = 0;
  current = el;
  return new Promise<void>((resolve, reject) => {
    const onEnd = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      probeCache.set(hash, false);
      reject(new Error(`file playback failed: ${hash}`));
    };
    const cleanup = () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('error', onError);
      if (current === el) current = null;
    };
    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onError);
    el.play().catch(err => {
      cleanup();
      reject(err);
    });
  });
}

export function stopFiles(): void {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}

/** Tier 1 preload: nothing to do for Tier 0. */
export function preloadFile(hash: string): void {
  let el = pool.get(hash);
  if (!el) {
    el = new Audio(`/audio/${hash}.mp3`);
    el.preload = 'auto';
    pool.set(hash, el);
  } else {
    el.preload = 'auto';
  }
}
