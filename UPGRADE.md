# UPGRADE.md — Hangout 2 English Quest, five-phase upgrade

This document records the five-phase upgrade of the Unit 1 learning experience
(classroom goal: 60–75 minutes per level), what was added to the data schema,
how activity content maps onto the eight mechanics, where the time constants
live, and what any future unit must supply to join the system.

## The five phases

1. **Schema, data, and pacing** — backward-compatible `Activity` schema
   (`estSeconds`, `depthMoves`, `schema: 2`), the expanded Unit 1 pack wired
   through `src/data/unit1/v2/` (30 content activities + CP1 + BOSS per
   level, slot merge with Core fallback), and the pacing engine
   (`src/lib/pacing.ts`) behind "About N minutes" labels.
2. **Activity mechanics** — the eight mechanics (below), the checkpoint
   runner, and the v2 dispatcher in `ActivityPage`.
3. **Depth moves and rituals** — D1–D5 applied generically from each slot's
   `depthMoves`, plus the ritual layer: `MissionBrief`, `TeachCard`, the CP1
   milestone node on the Quest Map, and end-of-station `Reflection`.
4. **Pacing instrumentation** — the `?debug=1` pacing auditor
   (`src/lib/pacingAudit.ts`), `LevelTiming` telemetry in the progress record,
   the Teacher Mode Pacing tab, and the fast-completion nudge on Results.
5. **Regression and handover** — this checklist run and this document.

## Schema additions (`src/types.ts`)

- `Activity.estSeconds?: number` — base seconds at Core pace (default 60 via
  `estSecondsOf`; never read directly).
- `Activity.depthMoves?: DepthMove[]` — `D1..D5` depth-of-knowledge moves.
- `Activity.schema?: 2` — pack schema stamp; v2 dispatch and per-slot XP use
  it. Legacy activities (Units 2/3) have no stamp and keep the old switch.
- `LevelProgress.missionBriefSeen`, `LevelProgress.checkpointCompleted` —
  ritual state.
- `ProgressData.reflections`, `ProgressData.levelTimings`,
  `ProgressData.activeTimings` — reflection answers and timing telemetry
  (localStorage only; nothing is ever sent anywhere).

## The eight mechanics (Phase 2)

| Mechanic | Component (all in `src/components/activities/` unless noted) |
|---|---|
| CHOICE_ITEM | `GapFill.tsx` (v2 `ChoiceItemBody`) |
| TAP_TOKEN | `TapToken.tsx` (new) |
| TAP_SENTENCE | `TapSentence.tsx` (new — the passage is the answer space) |
| TILE_SEQUENCE | `SentenceBuilder.tsx` (v2 `TileSequenceBody`) |
| TYPED_ANSWER | `TypedAnswer.tsx` (new) |
| SORT_BINS | `DragSort.tsx` (shared `SortBinsBody`) |
| TWO_PASS_AUDIO | `TwoPassAudio.tsx` (new) |
| SPEAKING | `RecordAndCompare.tsx` (`SpeakingV2`, one recorder, seven modes) |
| CHECKPOINT_RUNNER | `CheckpointRunner.tsx` (new; composes the eight, XP once at the end) |

Type→mechanic mapping lives in `renderV2Activity` in
`src/pages/ActivityPage.tsx`; shared helpers are in `v2-types.ts`.
`src/components/stations/` does not exist in this app — zero files there.

## Where the time constants live

- **Pack** (`src/data/unit1/v2/hangout2-unit1-expanded-pack.json`):
  `pacing.levelTimeMultiplier` (easy .85 / core 1 / challenging 1.05),
  `pacing.checkpointSeconds` (CP1 300 + BOSS 420), per-slot `estSeconds`
  (authoring units — never edit them to change displayed time),
  `pacing.calibration` (value 0.72, fitted 0.711, basis: the Unit 1 pilot),
  and `auditorRules` (30 content / 2 checkpoints / app minutes 42–56 /
  lesson minutes 58–75 / skill-share tolerance ±2 / fast-completion
  threshold 25 s per activity).
- **Code**: `src/lib/pacing.ts` is the single calibrated engine —
  `PACING_CALIBRATION = 0.72` multiplies the raw authoring estimate at
  display time (checkpoints unscaled; split by the slots' `skill: 'mixed'`),
  `TEACHER_FRAME_MINUTES = 15` is added for lesson labels. Legacy packs
  without `estSeconds` fail `isCalibratable` and render **no** duration.
  `src/lib/pacingAudit.ts` mirrors the audit rules (app minutes 42–56,
  lesson 58–75 as an amber advisory, ±2 skill shares) and prints
  raw → calibrated → label per level.

Calibrated labels: app **45 / 51 / 53** minutes; lesson **60 / 66 / 68**
minutes with warm-up and wrap-up. Skill shares unchanged:
25.0 / 24.9 / 15.0 / 15.0 / 10.0 / 10.0. Re-fit `PACING_CALIBRATION` after
each new pilot (`k = Σ(projected × measured) / Σ(projected²)`) — one line.

## What a future unit must do

1. **Supply `estSeconds` for every slot.** Without it the pacing engine falls
   back to 60 s per activity, the "About N minutes" label lies, and the
   `?debug=1` auditor fails its projected-minutes and skill-share rows.
   Declare the per-skill time budget to match the shares above.
2. **Declare `depthMoves` on every slot.** The Phase 3 moves (D1 reason
   chip, D2 produce-instead-of-recognise, D3 model-after, D4 tap-the-sentence
   frame, D5 two-pass transcript lock) are applied generically wherever they
   are declared; a slot without `depthMoves` fails the auditor's "each move
   ≥ 2" and "no activity without depthMoves" rows.

Also recommended: follow the pack's merge contract (slot joined with
`levels[level].content[slot]`, Core fallback), stamp `schema: 2` via
`buildLevel`, add `whyChoices` (best reason first — index 0 is treated as
correct) where D1 applies, and provide `ritual` content (mission brief,
teach cards, reflection prompts) so the ritual layer activates.
