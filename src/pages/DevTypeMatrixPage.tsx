import { Link } from 'react-router-dom';
import { GapFill } from '../components/activities/GapFill';
import { TapToken } from '../components/activities/TapToken';
import { TapSentence } from '../components/activities/TapSentence';
import { SentenceBuilder } from '../components/activities/SentenceBuilder';
import { TypedAnswer } from '../components/activities/TypedAnswer';
import { DragSort } from '../components/activities/DragSort';
import { TwoPassAudio } from '../components/activities/TwoPassAudio';
import { RecordAndCompare } from '../components/activities/RecordAndCompare';
import { DiaryPrompt } from '../components/activities/DiaryPrompt';
import { CheckpointRunner } from '../components/activities/CheckpointRunner';
import { ShortResponse } from '../components/capstone/CapstoneItem';
import type { Activity } from '../types';
import type { ItemResult } from '../components/activities/v2-types';

/**
 * PHASE 10 — the dev type matrix (Part J). Dev-only: this module is imported
 * behind import.meta.env.DEV, so a production build never ships the route.
 * One instance of every type in the ledger, in the states that break: a few
 * seconds of scrolling beats 108 levels of play. Each card names its source
 * pack item so a wrong rendering can be traced in one click.
 */

const noopResult: ItemResult = () => {};
// ShortResponse (capstone) also accepts a skip (null).
const noopCapstoneResult = (_correct: boolean | null) => {};

function act(type: Activity['type'], payload: Record<string, unknown>, prompt = ''): Activity {
  return {
    id: `matrix-${type}`,
    skill: 'vocabulary',
    type,
    prompt,
    payload: payload as never,
    xp: 0,
    estSeconds: 30,
    schema: 2,
    difficulty: 'core',
    unitId: 1,
  } as unknown as Activity;
}

function Card({ title, sourceRef, children }: { title: string; sourceRef?: string; children: React.ReactNode }) {
  return (
    <section className="surface-card mb-4 p-5">
      <p className="eyebrow mb-1">{title}</p>
      {sourceRef && <p className="mb-3 text-[11px] font-mono text-muted">source: {sourceRef}</p>}
      {children}
    </section>
  );
}

export function DevTypeMatrixPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <p className="eyebrow mb-1">DEV ONLY — never ships</p>
      <h1 className="mb-1 font-heading text-2xl font-extrabold text-ink">Type matrix</h1>
      <p className="mb-5 text-sm leading-6 text-muted">
        One live instance of every renderer, in the states that break. The ledger lives at{' '}
        <code>src/data/audit/type-ledger.json</code>; the contract at{' '}
        <code>src/data/audit/renderer-map.json</code>. Back to{' '}
        <Link to="/" className="text-brand underline">the app</Link>.
      </p>

      <Card title="CHOICE_ITEM — GapFill (gapFill / oddOneOut / questionForms / transform / preReadVocab)" sourceRef="U1 V8 v8-2">
        <GapFill activity={act('gapFill', { items: [{ id: 'm1', stem: 'This lemon is very ___!', options: ['sour', 'sweet', 'salty', 'spicy'], answer: 'sour', why: 'Lemons are sour.' }] })} onResult={noopResult} />
      </Card>

      <Card title="CHOICE_ITEM with whyChoices but NO item why — self-report chip (347 items)" sourceRef="U1 L1 l1-1">
        <GapFill activity={act('audioQuestion', { items: [{ id: 'm2', audio: 'For lunch I had a cheese sandwich.', q: 'What did the speaker eat?', options: ['Cheese sandwich', 'Soup', 'Salad'], answer: 'Cheese sandwich' }], whyChoices: ['I heard the food word', 'I guessed'] })} onResult={noopResult} />
      </Card>

      <Card title="CHOICE_ITEM — pictureToWord / wordToPicture (ImageChoice)" sourceRef="U1 V8 v8-5">
        <GapFill activity={act('pictureToWord', { items: [{ id: 'm3', img: 'carrot', options: ['carrot', 'cookie', 'cheese'], answer: 'carrot' }] })} onResult={noopResult} />
      </Card>

      <Card title="TAP_TOKEN as CHOICE_ITEM — errorCorrection (repeated-word safety)" sourceRef="U1 CP1 cp1-3">
        <TapToken activity={act('errorCorrection', { items: [{ id: 'm4', sentence: 'She said that that book is hers.', wrong: 'that', correct: 'that', why: 'The doubled that is deliberate.' }] })} onResult={noopResult} />
      </Card>

      <Card title="TAP_SENTENCE — index matching, colon sentence stays whole" sourceRef="U1 Chall R4 r4-1">
        <TapSentence activity={act('findSentence', { items: [{ id: 'm5', q: 'Tap the sentence with the colon.', answer: 'Watermelons stay on the ground: they are too heavy to climb.', answerType: 'tapSentence' }] })} onResult={noopResult} passage="Watermelons stay on the ground: they are too heavy to climb. They grow on a vine. The vine has yellow flowers." passageTitle="Watermelons" />
      </Card>

      <Card title="TAP_SENTENCE — figure preserved: tap “2,000”" sourceRef="U9 Core R4 r4-2">
        <TapSentence activity={act('findSentence', { items: [{ id: 'm6', q: 'How old was the tree?', answer: 'It was very tall, and it was over 2,000 years old.', answerType: 'tapSentence' }] })} onResult={noopResult} passage="It was very tall, and it was over 2,000 years old. The trail is closed in the winter." passageTitle="The old tree" />
      </Card>

      <Card title="TILE_SEQUENCE / TAP_TOKEN — repeated letters, index identity" sourceRef="U1 Core V7 v7-1 (vegetables, three e)">
        <SentenceBuilder activity={act('spelling', { items: [{ id: 'm7', letters: ['v', 'e', 'g', 'e', 't', 'a', 'b', 'l', 'e', 's'], answer: 'vegetables', audio: 'vegetables' }] })} onResult={noopResult} />
      </Card>

      <Card title="TAP_TOKEN — the space tile is required" sourceRef="U5 Chall V7 v7-2 (swing set)">
        <SentenceBuilder activity={act('spelling', { items: [{ id: 'm8', letters: ['s', 'w', 'i', 'n', 'g', ' ', 's', 'e', 't'], answer: 'swing set' }] })} onResult={noopResult} />
      </Card>

      <Card title="TILE_SEQUENCE — repeated word tile (she ×2)" sourceRef="U1 Chall W1 w1-4">
        <SentenceBuilder activity={act('sentenceBuilder', { items: [{ id: 'm9', tiles: ["She", "doesn't", "like", "vegetables", "but", "she", "likes", "fruit"], answer: "She doesn't like vegetables but she likes fruit." }] })} onResult={noopResult} />
      </Card>

      <Card title="TYPED_ANSWER — typo tolerance with the close-enough line" sourceRef="U1 V8 v8-3 (school)">
        <TypedAnswer activity={act('typeIt', { items: [{ id: 'm10', prompt: 'Type the word you hear.', audio: 'school', answer: 'school', allowOneLetterTypo: true }] })} onResult={noopResult} />
      </Card>

      <Card title="TYPED_ANSWER — sentence repair with word diff" sourceRef="capstone r1-writing r1w-3">
        <TypedAnswer activity={act('sentenceRepair', { items: [{ id: 'm11', wrong: 'He want a glass of lemonade.', answer: 'He wants a glass of lemonade.' }] })} onResult={noopResult} />
      </Card>

      <Card title="SORT_BINS — 2 bins" sourceRef="U1 G4">
        <DragSort activity={act('dragSort', { bins: ['Sweet', 'Not sweet'], items: [{ word: 'cookie', bin: 'Sweet', why: 'Cookies are sweet.' }, { word: 'cheese', bin: 'Not sweet' }] })} onResult={noopResult} />
      </Card>

      <Card title="SORT_BINS — 3 bins" sourceRef="U9 G4 (three-bin variant)">
        <DragSort activity={act('dragSort', { bins: ['Was', 'Were', 'Both'], items: [{ word: 'the lake', bin: 'Was' }, { word: 'two hills', bin: 'Were' }, { word: 'there', bin: 'Both' }] })} onResult={noopResult} />
      </Card>

      <Card title="SORT_BINS — 4 bins with guidance and the ger overlap" sourceRef="U8 Chall V4">
        <DragSort activity={act('dragSort', { guidance: 'A ger has a bed and a table too — but the pack wants the room the book shows.', bins: ['Bedroom', 'Living room', 'Kitchen', 'Inside a ger'], items: [{ word: 'bed', bin: 'Bedroom' }, { word: 'sofa', bin: 'Living room' }, { word: 'stove', bin: 'Kitchen' }, { word: 'table', bin: 'Inside a ger', why: 'The book shows a table inside the ger.' }] })} onResult={noopResult} />
      </Card>

      <Card title="TWO_PASS_AUDIO — transcript locked until both passes" sourceRef="U1 BOSS b-4 (item-level shape)">
        <TwoPassAudio activity={act('twoPass', { audio: 'This is my living room. There is a big sofa, and there is a television in front of it.', passes: [{ pass: 1, job: 'gist', q: 'Which room is it?', options: ['Kitchen', 'Living room'], answer: 'Living room' }, { pass: 2, job: 'detail', q: 'What is in front of the television?', options: ['A sofa', 'A plant'], answer: 'A sofa' }] })} onResult={noopResult} />
      </Card>

      <Card title="SPEAKING — model withheld until a recording exists (S1)" sourceRef="U1 S1 s1-1">
        <RecordAndCompare activity={act('warmUpRepeat', { items: [{ id: 'm12', model: 'I like cookies.', keywords: ['like', 'cookies'] }] })} onResult={noopResult} mode="warmUpRepeat" />
      </Card>

      <Card title="SPEAKING — personal response (item-level in runners)" sourceRef="U1 CP1 cp1-6">
        <RecordAndCompare activity={act('askAnswer', { items: [{ id: 'm13', q: 'What is your favourite food, and why?', keywords: ['like', 'because'] }] })} onResult={noopResult} mode="askAnswer" />
      </Card>

      <Card title="CHART — no chart, starters and checklist only" sourceRef="U1 W3">
        <DiaryPrompt activity={act('guidedParagraph', { prompt: 'Write about food you like.', starters: ['I like…', 'I don\'t like…'], checklist: ['Correct like / likes'], minimumWords: 10 })} onResult={noopResult} />
      </Card>

      <Card title="CHART — two-column (columnA is a STRING)" sourceRef="U8 Core W3">
        <DiaryPrompt activity={act('guidedParagraph', { prompt: 'Where are the things in your room?', chart: { rows: 3, columnA: 'Thing', columnB: 'Where is it?' }, starters: ['The … is …'], minimumWords: 12 })} onResult={noopResult} />
      </Card>

      <Card title="CHART — three-prompt (columnA is an ARRAY)" sourceRef="U9 Core W3">
        <DiaryPrompt activity={act('guidedParagraph', { prompt: 'What was there?', chart: { rows: 3, columnA: ['A place you visited', 'What was there', 'Who was with you'], columnBStem: ['e.g. the lake', 'e.g. two hills', 'e.g. my class'] }, minimumWords: 15 })} onResult={noopResult} />
      </Card>

      <Card title="CHART — picker (choosePlace; the key name is the label)" sourceRef="U9 Easy W3">
        <DiaryPrompt activity={act('guidedParagraph', { prompt: 'Write about a field trip.', choosePlace: ['the lake', 'the beach', 'the forest', 'the park'], starters: ['Last week we went to…'], minimumWords: 10 })} onResult={noopResult} />
      </Card>

      <Card title="CHART — shortResponse (capstone writing item)" sourceRef="capstone r1-writing r1w-4">
        <ShortResponse item={{ id: 'm14', type: 'shortResponse', answer: '', prompt: 'Write three sentences about what you like.', minimumWords: 10, checklist: ['Correct like / likes'] }} onResult={noopCapstoneResult} />
      </Card>

      <Card title="RUNNER — CheckpointRunner dispatch (heterogeneous container)" sourceRef="U1 CP1">
        <CheckpointRunner activity={act('checkpoint', { items: [
          { id: 'r1', type: 'gapFill', stem: 'This lemon is very ___!', options: ['sour', 'sweet'], answer: 'sour' },
          { id: 'r2', type: 'speaking', q: 'Say your favourite food.', keywords: ['like'] },
          { id: 'r3', type: 'typeIt', prompt: 'Type the word.', answer: 'rice' },
        ] })} onResult={noopResult} />
      </Card>
    </div>
  );
}
