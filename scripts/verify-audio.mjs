// Audio verifier — compares the manifest against what is actually on disk
// and exits 1 if anything is missing, so a deploy can gate on it. Also fills
// the manifest's per-clip `seconds` (null until a real file exists) using
// ffprobe, and checks the <12 MB-per-unit weight budget.
//
//   npm run audio:verify
//
// With /public/audio/ empty (Tier 0 only), this reports every clip missing
// and exits 1 — that is the expected state until audio:render has run. The
// app itself works fine on Tier 0 alone.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST = path.join(ROOT, 'src/data/audio/manifest.json');
const AUDIO_DIR = path.join(ROOT, 'public/audio');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const clips = Object.values(manifest.clips);
const diskFiles = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3')));

function ffprobeSeconds(hash) {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path.join(AUDIO_DIR, `${hash}.mp3`),
    ], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const n = Number(out);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
  } catch {
    return null;
  }
}

const missing = [];
const present = [];
let manifestDirty = false;

for (const clip of clips) {
  const file = `${clip.hash}.mp3`;
  if (diskFiles.has(file)) {
    present.push(clip);
    diskFiles.delete(file);
    if (clip.seconds === null || clip.seconds === undefined) {
      const secs = ffprobeSeconds(clip.hash);
      if (secs !== null) {
        clip.seconds = secs;
        manifestDirty = true;
      }
    }
  } else {
    missing.push(clip);
  }
}

// Orphans: MP3s on disk the manifest does not know about.
const orphaned = [...diskFiles];

// Per-unit weight (Part H budget: under 12 MB per unit at 64 kbps mono).
const perUnit = new Map();
let totalBytes = 0;
for (const clip of present) {
  const bytes = fs.statSync(path.join(AUDIO_DIR, `${clip.hash}.mp3`)).size;
  totalBytes += bytes;
  perUnit.set(clip.unit, (perUnit.get(clip.unit) ?? 0) + bytes);
}

// Clips most likely to need re-splitting (Part D rule 3 caps chunks at ~180
// chars for synthesis, but rendered files have no such cap until they get long).
const longClips = present.filter(c => typeof c.seconds === 'number' && c.seconds > 12);
const stillNull = present.filter(c => c.seconds === null || c.seconds === undefined);

console.log('audio:verify ──────────────────────────────────');
console.log(`clips in manifest : ${clips.length}`);
console.log(`files on disk     : ${present.length}`);
console.log(`missing           : ${missing.length}`);
console.log(`orphaned on disk  : ${orphaned.length}`);
console.log(`total size        : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
for (const [unit, bytes] of [...perUnit.entries()].sort((a, b) => a[0] - b[0])) {
  const mb = bytes / 1024 / 1024;
  console.log(`  unit ${String(unit).padStart(2)}      : ${mb.toFixed(2)} MB${mb > 12 ? '  ⚠ over 12 MB budget' : ''}`);
}
if (stillNull.length > 0) {
  console.log(`seconds unknown   : ${stillNull.length} (ffprobe missing or unreadable file)`);
}
if (longClips.length > 0) {
  console.log(`clips over 12 s   : ${longClips.length}`);
  for (const c of longClips) {
    console.log(`  ${c.hash}  ${c.seconds}s  u${c.unit} ${c.category}  "${c.text.slice(0, 60)}…"`);
  }
}

if (manifestDirty) {
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('manifest updated with probed seconds');
}

if (orphaned.length > 0) {
  console.log('orphaned files (in /public/audio but not in the manifest):');
  for (const f of orphaned) console.log(`  ${f}`);
}

if (missing.length > 0 || orphaned.length > 0) {
  console.error('audio:verify: FAIL — missing or orphaned clips; do not deploy rendered audio in this state');
  process.exit(1);
}
console.log('audio:verify: OK');
