// PHASE 10 — the type ledger. Extracts the FULL type surface from the ten
// packs (unit1..9 v2 + capstone), diffs it against the hand-maintained
// renderer contract (src/data/audit/renderer-map.json), and writes
// src/data/audit/type-ledger.json.
//
// Exit 1 when EITHER condition holds:
//   (a) a type appears in the packs with no entry in renderer-map.json
//   (b) a map entry points at a file that does not exist, or is marked
//       "fallback" — a renderer that silently shows a generic choice grid
//
// Also verifies, per Part D, that every spelling `letters[]` is the same
// multiset as its answer (spaces included), every sentenceBuilder `tiles[]`
// is the same multiset as its answer's words, and counts the whyChoices
// slots whose items carry no `why` (Part I). Content bugs surface here, not
// in front of a learner.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAP_PATH = path.join(ROOT, 'src/data/audit/renderer-map.json');
const LEDGER_PATH = path.join(ROOT, 'src/data/audit/type-ledger.json');

const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

// ── Pack loading ──────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
}

const unitPacks = [];
for (let u = 1; u <= 9; u++) {
  const p = `src/data/unit${u}/v2/hangout2-unit${u}-expanded-pack.json`;
  if (fs.existsSync(path.join(ROOT, p))) unitPacks.push({ id: u, pack: readJson(p), src: p });
}
const capstone = { id: 10, pack: readJson('src/data/capstone/hangout2-capstone-pack.json'), src: 'src/data/capstone/hangout2-capstone-pack.json' };
const packs = [...unitPacks, capstone];

// ── Extraction ────────────────────────────────────────────────────────────────

// types[type] = { surfaces:Set, count, units:Set, surfaceUnits:Map, samples:[] }
// surfaceUnits tracks WHERE each surface occurs (unit ids) — slot-level in
// units 1-9 and item-level in the capstone are different obligations.
const types = new Map();
const noteType = (type, surface, unit, ref) => {
  if (!type) return;
  const t = types.get(type) ?? { surfaces: new Set(), count: 0, units: new Set(), surfaceUnits: new Map(), samples: [] };
  t.surfaces.add(surface);
  t.count++;
  t.units.add(unit);
  const su = t.surfaceUnits.get(surface) ?? new Set();
  su.add(unit);
  t.surfaceUnits.set(surface, su);
  if (t.samples.length < 3) t.samples.push(`${ref}`);
  types.set(type, t);
};

const spellingChecks = [];
const tileChecks = [];
let whySlotsTotal = 0;
let whySlotsMissing = 0;
const whyMissingDetail = [];

function scanUnitItems(unitId, slotId, level, entry) {
  const items = Array.isArray(entry?.items) ? entry.items : [];
  let whyCount = 0;
  for (const item of items) {
    noteType(item.type, 'item', unitId, `U${unitId} ${level} ${slotId} ${item.id ?? ''}`.trim());
    if (item.answerType) noteType(item.answerType, 'answerType', unitId, `U${unitId} ${level} ${slotId} ${item.id ?? ''}`.trim());
    if (item.why) whyCount++;
    // Part D content assertions
    if (Array.isArray(item.letters) && typeof item.answer === 'string') {
      spellingChecks.push({ unit: unitId, level, slot: slotId, id: item.id ?? '', letters: item.letters, answer: item.answer });
    }
    if (Array.isArray(item.tiles) && typeof item.answer === 'string' && item.tiles.length > 0) {
      tileChecks.push({ unit: unitId, level, slot: slotId, id: item.id ?? '', tiles: item.tiles, answer: item.answer });
    }
  }
  if (Array.isArray(entry?.whyChoices) && entry.whyChoices.length > 0) {
    whySlotsTotal++;
    if (whyCount === 0) {
      whySlotsMissing++;
      if (whyMissingDetail.length < 12) whyMissingDetail.push(`U${unitId} ${level} ${slotId} (${items.length} items, 0 why)`);
    }
  }
}

for (const { id: unitId, pack, src } of unitPacks) {
  const slots = Array.isArray(pack.slots) ? pack.slots : [];
  for (const slot of slots) {
    if (slot.type) noteType(slot.type, 'slot', unitId, `U${unitId} slots[] ${slot.slot}`);
  }
  for (const level of ['easy', 'core', 'challenging']) {
    const content = pack.levels?.[level]?.content ?? {};
    for (const [slotId, entry] of Object.entries(content)) {
      scanUnitItems(unitId, slotId, level, entry);
    }
  }
}

// Capstone: station skills stand in for slot types; items carry explicit types.
for (const island of capstone.pack.islands) {
  for (const station of island.stations) {
    for (const item of station.items ?? []) {
      noteType(item.type, 'item', 10, `capstone ${island.id} ${station.id} ${item.id}`);
      if (item.answerType) noteType(item.answerType, 'answerType', 10, `capstone ${island.id} ${station.id} ${item.id}`);
    }
  }
  for (const item of island.seal.items ?? []) {
    noteType(item.type, 'item', 10, `capstone ${island.id} ${island.seal.id} ${item.id}`);
  }
}
for (const item of capstone.pack.finalGate.items ?? []) {
  noteType(item.type, 'item', 10, `capstone final-gate ${item.id}`);
}

// ── Runner dispatch registries (Part H) ───────────────────────────────────────

// TWO heterogeneous runners exist, and each must cover the item types its
// own packs embed: CheckpointRunner for CP1/BOSS/mixedRecall (units 1-9),
// CapstoneItemBody for the capstone's stations, seals and Final Gate. Any
// embedded type a runner does not handle is a failing condition — never a
// silent fallback to a choice grid.
function registryFromSource(file, exportName) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = src.match(new RegExp(`${exportName}[^=]*=\\s*[[{]([\\s\\S]*?)[\\]}];`));
  return new Set(m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : []);
}
const unitRunnerHandled = registryFromSource('src/components/activities/CheckpointRunner.tsx', 'RUNNER_HANDLED_ITEM_TYPES');
const capstoneRunnerHandled = registryFromSource('src/components/capstone/CapstoneItem.tsx', 'CAPSTONE_HANDLED_ITEM_TYPES');

const runnerGaps = [];
for (const [type, t] of types.entries()) {
  const itemUnits = t.surfaceUnits.get('item');
  if (!itemUnits) continue;
  // Only ITEM-level occurrences are a runner obligation; slot-level types
  // render through renderV2Activity, not a runner.
  const itemInUnitPacks = [...itemUnits].some(u => u <= 9);
  const itemInCapstone = itemUnits.has(10);
  if (itemInUnitPacks && !unitRunnerHandled.has(type)) runnerGaps.push(`${type} (units 1-9 items → CheckpointRunner)`);
  if (itemInCapstone && !capstoneRunnerHandled.has(type)) runnerGaps.push(`${type} (capstone items → CapstoneItemBody)`);
}

// ── Renderer resolution ───────────────────────────────────────────────────────

const fileExists = rel => fs.existsSync(path.join(ROOT, rel));
const unrendered = [];
const fallbacks = [];
const ledgerTypes = {};
for (const [type, t] of [...types.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const entry = map.types[type];
  if (!entry) {
    unrendered.push({ type, surface: [...t.surfaces].join('+'), count: t.count, units: [...t.units].sort((a, b) => a - b) });
    continue;
  }
  const renderer = entry.renderer;
  const file = entry.file;
  const exists = file ? fileExists(file) : false;
  const status = entry.status === 'fallback' || !exists ? 'fallback' : (entry.status ?? 'implemented');
  if (entry.status === 'fallback' || !exists) {
    fallbacks.push({ type, renderer, file: file ?? '(no file recorded)', reason: !exists ? 'file missing' : 'marked fallback' });
  }
  ledgerTypes[type] = {
    surface: [...t.surfaces].sort().join('+'),
    count: t.count,
    units: [...t.units].sort((a, b) => a - b),
    mechanic: entry.mechanic,
    renderer,
    status,
    sampleRef: entry.sampleRef ?? t.samples[0] ?? '',
  };
}
// Map entries that exist in the contract but never appear in the packs.
const unusedInPacks = Object.keys(map.types).filter(k => !types.has(k));
for (const type of unusedInPacks) {
  const entry = map.types[type];
  ledgerTypes[type] = {
    surface: entry.surface ?? 'unused',
    count: 0,
    units: [],
    mechanic: entry.mechanic,
    renderer: entry.renderer,
    status: 'unused',
    sampleRef: entry.sampleRef ?? '',
  };
}

// ── Multiset checks (Part D) ──────────────────────────────────────────────────

const multiset = arr => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
};
const sameMultiset = (a, b) => {
  const ma = multiset(a);
  const mb = multiset(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) if (mb.get(k) !== v) return false;
  return true;
};

const letterMismatches = [];
for (const c of spellingChecks) {
  const want = c.answer.split(''); // spaces included: a space tile is a real tile
  if (!sameMultiset(c.letters, want)) {
    letterMismatches.push({ unit: c.unit, level: c.level, slot: c.slot, id: c.id, letters: c.letters.join(''), answer: c.answer });
  }
}
const tileMismatches = [];
for (const c of tileChecks) {
  // Tile pools deliberately omit terminal punctuation; the comparison
  // normalises it away, so the multiset check must too: compare against the
  // answer's words with edge punctuation stripped (internal apostrophes stay).
  const want = c.answer
    .replace(/[.!?;,:]+$|[.!?;,:]+(?=\s|$)/g, '')
    .split(/\s+/).filter(Boolean)
    .map(w => w.replace(/^[“"(']+|[)"',.:;!?”]+$/g, ''));
  if (!sameMultiset(c.tiles, want)) {
    tileMismatches.push({ unit: c.unit, level: c.level, slot: c.slot, id: c.id, tiles: c.tiles.join(' '), answer: c.answer });
  }
}

// ── Ledger + verdict ──────────────────────────────────────────────────────────

const ledger = {
  generated: new Date().toISOString(),
  packs: packs.map(p => p.src),
  typeCount: types.size,
  contractTypes: Object.keys(map.types).length,
  types: ledgerTypes,
  unrendered,
  fallbacks,
  runnerGaps,
  checks: {
    spellingMultiset: { scanned: spellingChecks.length, mismatches: letterMismatches },
    tileMultiset: { scanned: tileChecks.length, mismatches: tileMismatches },
    whyChoicesWithoutWhy: { slots: whySlotsTotal, missing: whySlotsMissing, detail: whyMissingDetail },
    runnerRegistry: {
      unitRunner: [...unitRunnerHandled],
      capstoneRunner: [...capstoneRunnerHandled],
      gaps: runnerGaps,
    },
  },
};
fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);

let failed = false;
if (unrendered.length > 0) {
  failed = true;
  console.error('audit:types FAIL — types in the packs with no renderer-map entry:');
  for (const u of unrendered) console.error(`  ${u.type} (${u.surface}, ×${u.count}, units ${u.units.join(',')})`);
}
if (fallbacks.length > 0) {
  failed = true;
  console.error('audit:types FAIL — renderer-map entries pointing at missing or fallback components:');
  for (const f of fallbacks) console.error(`  ${f.type} → ${f.renderer} (${f.reason}: ${f.file})`);
}
if (runnerGaps.length > 0) {
  failed = true;
  console.error('audit:types FAIL — item types the heterogeneous runner does not dispatch:');
  for (const g of runnerGaps) console.error(`  ${g} (CheckpointRunner.RUNNER_HANDLED_ITEM_TYPES)`);
}
if (letterMismatches.length > 0) {
  failed = true;
  console.error('audit:types FAIL — spelling letters[] multiset != answer:');
  for (const m of letterMismatches) console.error(`  U${m.unit} ${m.level} ${m.slot} ${m.id}: letters "${m.letters}" vs answer "${m.answer}"`);
}
if (tileMismatches.length > 0) {
  failed = true;
  console.error('audit:types FAIL — sentenceBuilder tiles[] multiset != answer words:');
  for (const m of tileMismatches) console.error(`  U${m.unit} ${m.level} ${m.slot} ${m.id}: tiles "${m.tiles}" vs answer "${m.answer}"`);
}

console.log(`audit:types — ${types.size} types in packs, ${Object.keys(map.types).length} in contract, ` +
  `spelling ${spellingChecks.length} scanned (${letterMismatches.length} mismatches), tiles ${tileChecks.length} scanned (${tileMismatches.length} mismatches), ` +
  `whyChoices slots missing why: ${whySlotsMissing}/${whySlotsTotal}`);
if (failed) process.exit(1);
console.log('audit:types OK');
