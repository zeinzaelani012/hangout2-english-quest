// IMAGE PACK MANIFEST — scans public/img/words/ for the user-supplied
// vocabulary artwork and writes src/data/images/manifest.json (slug → URL).
// VocabIllustration renders the file when present and falls back to the SVG
// chain when not, so the pack can land gradually, word by word.
//
//   npm run images:manifest
//
// Also prints per-unit coverage so the artist can see what is still missing.
// The output is deterministic (sorted, no timestamps) so a clean rebuild
// never dirties the working tree.

import fs from 'node:fs';
import path from 'node:path';

const WORD_DIR = 'public/img/words';
const MAP_PATH = 'src/data/images/word-map.json';
const OUT_PATH = 'src/data/images/manifest.json';

const EXTENSIONS = new Set(['webp', 'png', 'jpg', 'jpeg', 'svg']);

const wordMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const files = fs.existsSync(WORD_DIR) ? fs.readdirSync(WORD_DIR) : [];

const images = {};
const unknown = [];
for (const file of files) {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (!EXTENSIONS.has(ext)) continue;
  const slug = path.basename(file, path.extname(file)).toLowerCase();
  images[slug] = `/img/words/${file}`;
}
for (const slug of Object.keys(images)) {
  if (!(Object.values(wordMap.hintToSlug).includes(slug))) unknown.push(slug);
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify({ images }, null, 2) + '\n');

const activeUnits = new Set(
  Object.keys(wordMap.unitSlugs).filter(unit => unit !== 'capstone'),
);
const unitSlugs = Object.fromEntries(
  Object.entries(wordMap.unitSlugs).filter(([unit]) => activeUnits.has(unit)),
);
const trackedSlugs = new Set(Object.values(unitSlugs).flat());
const activeConcepts = Object.keys(images).filter(slug => trackedSlugs.has(slug));

// Coverage report — all current unit lists against the files on disk.
let total = 0;
let have = 0;
const lines = [];
for (const [unit, slugs] of Object.entries(unitSlugs)) {
  const present = slugs.filter(s => images[s]);
  const missing = slugs.filter(s => !images[s]);
  total += slugs.length;
  have += present.length;
  lines.push(
    `${unit.padEnd(9)} ${String(present.length).padStart(2)}/${String(slugs.length).padStart(2)} present` +
    (missing.length ? `  missing: ${missing.join(', ')}` : '  ✓ complete'),
  );
}
console.log(`images:manifest — ${Object.keys(images).length} file(s) in ${WORD_DIR}`);
console.log(lines.join('\n'));
console.log(`images:manifest — ${activeConcepts.length}/${trackedSlugs.size} tracked concepts covered`);
if (unknown.length) {
  console.log(`images:manifest — files with no matching concept (ignored by the app): ${unknown.join(', ')}`);
}
