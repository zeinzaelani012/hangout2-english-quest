// PHASE 8 — build the audio manifest from the nine content packs.
//
// Every `audio`, `model`, `chunk`, dialogue line and reading passage in the
// nine packs is a SCRIPT, not a file. This script walks them all, assigns a
// speaker role, deduplicates by role + normalised text hash, and writes
// src/data/audio/manifest.json — the single source of truth for playback.
//
// Usage: node scripts/build-audio-manifest.mjs   (or npm run audio:manifest)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const DATA = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(DATA, 'audio');
const UNITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Speaker roles — content refers to roles, never to voices or voice names.
const ROLE_PITCH = {
  narrator: 1.0,
  ana: 1.12,
  ben: 0.94,
  brian: 0.96,
  mia: 1.1,
  lina: 1.06,
};

const KNOWN_ROLES = new Set(Object.keys(ROLE_PITCH));

function roleForSpeaker(speaker) {
  const n = String(speaker || '').trim().toLowerCase();
  if (KNOWN_ROLES.has(n)) return n;
  return 'narrator';
}

// Normalise before hashing: trim, collapse whitespace, straighten curly
// quotes, and end with terminal punctuation so the synthesiser falls into
// statement intonation rather than trailing off.
function normaliseText(text) {
  let t = String(text ?? '').trim().replace(/\s+/g, ' ');
  t = t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  if (/[a-z0-9]$/i.test(t)) t += '.';
  return t;
}

function hash(role, text) {
  return crypto.createHash('sha256').update(role + '\u0000' + text).digest('hex').slice(0, 10);
}

function addClip(clips, { role, text, unit, category }) {
  const norm = normaliseText(text);
  if (!norm) return;
  const h = hash(role, norm);
  if (clips[h]) {
    if (clips[h].text !== norm) {
      console.error(`HASH COLLISION: ${h} already "${clips[h].text}" vs "${norm}" (${unit} ${category})`);
      process.exitCode = 1;
    }
    return;
  }
  clips[h] = { hash: h, text: norm, role, unit, category, seconds: null };
}

function itemsOf(entry) {
  return Array.isArray(entry?.items) ? entry.items : [];
}

function collectFromPack(clips, pack, unitId) {
  for (const level of ['easy', 'core', 'challenging']) {
    const content = pack.levels[level]?.content ?? {};
    for (const entry of Object.values(content)) {
      for (const item of itemsOf(entry)) {
        if (item.audio) addClip(clips, { role: 'narrator', text: item.audio, unit: unitId, category: 'item_audio' });
        if (item.model) addClip(clips, { role: 'narrator', text: item.model, unit: unitId, category: 'speaking_model' });
        if (item.chunk) addClip(clips, { role: 'narrator', text: item.chunk, unit: unitId, category: 'chunk' });
      }
      if (entry.passage) addClip(clips, { role: 'narrator', text: entry.passage, unit: unitId, category: 'passage' });
    }
  }
  // Dialogue lines are per-line, per-speaker.
  for (const line of pack.dialogue?.lines ?? []) {
    addClip(clips, { role: roleForSpeaker(line.speaker), text: line.text, unit: unitId, category: 'dialogue_line' });
  }
  // Phonics words.
  for (const a of pack.phonics?.anchorWords ?? []) {
    addClip(clips, { role: 'narrator', text: a.word, unit: unitId, category: 'phonics_word' });
  }
  for (const s of pack.phonics?.sortItems ?? []) {
    addClip(clips, { role: 'narrator', text: s.word, unit: unitId, category: 'phonics_word' });
  }
}

function selfCheckClips(clips) {
  // Phase 7 can-do statements have read-aloud buttons. Packs 1-7 carry their
  // blocks inside the pack; 8-9 in the standalone blocks file.
  const add = (unitId, sa) => {
    if (!sa) return;
    for (const perLevel of Object.values(sa.skills ?? {})) {
      for (const statement of Object.values(perLevel)) {
        addClip(clips, { role: 'narrator', text: statement, unit: unitId, category: 'self_check' });
      }
    }
  };
  for (const unitId of UNITS) {
    const packPath = path.join(DATA, `unit${unitId}`, 'v2', `hangout2-unit${unitId}-expanded-pack.json`);
    try {
      add(unitId, JSON.parse(fs.readFileSync(packPath, 'utf8')).selfAssessment);
    } catch {
      /* pack not present */
    }
  }
}

function main() {
  const clips = {};
  for (const unitId of UNITS) {
    const packPath = path.join(DATA, `unit${unitId}`, 'v2', `hangout2-unit${unitId}-expanded-pack.json`);
    const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    collectFromPack(clips, pack, unitId);
  }
  selfCheckClips(clips);

  const manifest = {
    version: 2,
    generated: new Date().toISOString(),
    voices: Object.fromEntries(Object.entries(ROLE_PITCH).map(([role, pitch]) => [role, { role, pitch }])),
    clips,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const byCategory = {};
  for (const c of Object.values(clips)) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  console.log(`clips: ${Object.keys(clips).length} unique`);
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) console.log(`  ${cat}: ${n}`);
}

main();
