import type { Activity, Level, VocabItem, Unit, Skill } from '../../types';
import { SKILL_WEIGHTS } from '../../types';
import { vocabulary } from './vocabulary';
import { readingTexts, dialogue, dialogueComprehension } from './reading';
import { grammarGapFill } from './grammar';
import { speakingTasks } from './speaking';
import { contentPack } from './contentPack';
import {
  makeActivity, getDistractors, optionCount, shuffle, showPictures, resetIdCounter,
} from './factory';

// Look up the illustration hint for a word-sort item: exact vocabulary match
// first, then a vocabulary word contained in the item (e.g. "fur hat" -> "fur").
function lookupVocabHint(word: string): string {
  const exact = vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
  if (exact) return exact.imgHint;
  const partial = vocabulary
    .filter(v => word.toLowerCase().includes(v.word.toLowerCase()))
    .sort((a, b) => b.word.length - a.word.length)[0];
  return partial?.imgHint || '';
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildVocabularyActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const setA = vocabulary.filter(v => v.set === 'A');
  const setB = vocabulary.filter(v => v.set === 'B');
  const setC = vocabulary.filter(v => v.set === 'C');

  const selected: VocabItem[] = [];
  const [aCount, bCount, cCount]: [number, number, number] = [2, 2, 1];

  const aItems = shuffle(setA).slice(0, aCount);
  const bItems = shuffle(setB).slice(0, bCount);
  const cItems = shuffle(setC).slice(0, cCount);
  selected.push(...aItems, ...bItems, ...cItems);

  const optsCount = optionCount(level);
  const allVocab = vocabulary;
  const picsOn = showPictures(level, 'vocabulary');

  for (const item of selected) {
    const distractors = getDistractors(item, allVocab, level, optsCount - 1);
    const options = shuffle([item, ...distractors]).map(v => ({
      id: v.id,
      label: v.word,
      vocabId: v.id,
      imgHint: picsOn ? v.imgHint : undefined,
    }));
    const correctIdx = options.findIndex(o => o.id === item.id);

    acts.push(makeActivity(
      'vocabulary',
      'pictureMatch',
      level === 'easy'
        ? `Tap the picture for "${item.word}".`
        : level === 'core'
          ? `Which one is "${item.word}"?`
          : `Find the word that matches: "${item.example.replace(item.word, '___')}"`,
      {
        prompt: item.word,
        promptAudio: item.word,
        options,
        answerId: options[correctIdx].id,
        hint: level === 'easy' ? `It starts with "${item.word[0]}".` : item.imgHint,
        why: `"${item.word}" — ${item.example}`,
      },
      level,
    ));
  }

  return acts;
}

// wordSorts -> the existing DragSort mechanic (bins are data, any count)
function buildWordSortActivities(level: Level): Activity[] {
  const sorts = contentPack.wordSorts[level];
  const hints: Record<Level, string> = {
    easy: 'Clothes are things you wear. Jewelry is what you wear on your body to look good.',
    core: 'Think about each word: is it a piece of clothing, jewelry, or for warm or cold weather?',
    challenging: 'Sort by where you wear it or what it is for. Read each word carefully.',
  };

  return sorts.map(sort => makeActivity(
    'vocabulary',
    'dragSort',
    `Sort the words into the right bins.`,
    {
      prompt: 'Drag each word into the right bin.',
      bins: sort.bins.map(label => ({ id: slug(label), label, imgHint: '' })),
      items: sort.items.map(item => ({
        id: `${sort.id}-${slug(item.word)}`,
        label: item.word,
        binId: slug(item.bin),
        imgHint: lookupVocabHint(item.word),
      })),
      hint: hints[level],
      why: `Each word belongs to one group: ${sort.bins.join(', ')}.`,
    },
    level,
  ));
}

function buildGrammarActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const items = grammarGapFill(level);

  for (const item of items.slice(0, 3)) {
    acts.push(makeActivity(
      'grammar',
      'gapFill',
      `Fill in the blank: ${item.sentence}`,
      {
        sentence: item.sentence,
        options: shuffle(item.options),
        answer: item.answer,
        hint: level === 'easy' ? `It starts with "${item.answer[0]}".` : item.why,
        why: item.why,
      },
      level,
    ));
  }

  return acts;
}

function buildListeningActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const items = contentPack.listening[level];

  for (const item of items) {
    if (item.type === 'audioQuestion') {
      acts.push(makeActivity(
        'listening',
        'gapFill',
        item.question || 'Listen and answer.',
        {
          sentence: `${item.question || ''} ___`,
          options: shuffle(item.options),
          answer: item.answer || '',
          hint: level === 'easy' ? `It starts with "${(item.answer || '')[0]}".` : 'Listen carefully to the whole audio.',
          why: `The audio says: "${item.script}"`,
          audioScript: item.script,
        },
        level,
      ));
    } else if (item.type === 'audioGap') {
      acts.push(makeActivity(
        'listening',
        'gapFill',
        'Listen and fill in the blank.',
        {
          sentence: item.script.replace(item.target || '', '___'),
          options: shuffle(item.options),
          answer: item.target || '',
          hint: level === 'easy' ? `It starts with "${(item.target || '')[0]}".` : 'Listen for the missing word.',
          why: `The word is "${item.target}".`,
          audioScript: item.script,
        },
        level,
      ));
    } else {
      // audioToPicture — PictureMatch with an audio prompt
      const target = item.target || '';
      const correctVocab = vocabulary.find(v => v.word === target);
      const optsCount = optionCount(level);
      const distractorWords = vocabulary.filter(v => v.word !== target);
      const distractors = shuffle(distractorWords).slice(0, optsCount - 1);
      const allOpts = shuffle([
        { id: target, label: target, imgHint: correctVocab?.imgHint },
        ...distractors.map(d => ({ id: d.word, label: d.word, imgHint: d.imgHint })),
      ]);

      acts.push(makeActivity(
        'listening',
        'pictureMatch',
        'Listen and tap the right picture.',
        {
          prompt: target,
          promptAudio: item.script,
          options: allOpts,
          answerId: target,
          hint: level === 'easy' ? `It starts with "${target[0]}".` : 'Listen carefully.',
          why: `The audio says: "${item.script}"`,
          audioScript: item.script,
        },
        level,
      ));
    }
  }

  return acts;
}

function buildReadingActivities(level: Level): Activity[] {
  const acts: Activity[] = [];

  const text1 = readingTexts[0]; // messageThread
  const text2 = readingTexts[1]; // hatsAroundTheWorld
  const t1 = text1[level];
  const t2 = text2[level];

  // 2 questions from text 1, 1 from text 2
  acts.push(makeActivity(
    'reading',
    'gapFill',
    `Read "${text1.title}" and answer: ${t1.questions[0].q}`,
    {
      sentence: `${t1.questions[0].q} ___`,
      options: shuffle([...t1.questions[0].options]),
      answer: t1.questions[0].answer,
      hint: level === 'easy' ? `It starts with "${t1.questions[0].answer[0]}".` : 'Look in the messages.',
      why: `The message says: "${getThreadSnippet(t1.questions[0].answer, t1.text as { speaker: string; text: string }[])}"`,
    },
    level,
  ));

  acts.push(makeActivity(
    'reading',
    'gapFill',
    `Read "${text1.title}" and answer: ${t1.questions[1].q}`,
    {
      sentence: `${t1.questions[1].q} ___`,
      options: shuffle([...t1.questions[1].options]),
      answer: t1.questions[1].answer,
      hint: level === 'easy' ? `It starts with "${t1.questions[1].answer[0]}".` : 'Think about what the messages tell you.',
      why: `The message says: "${getThreadSnippet(t1.questions[1].answer, t1.text as { speaker: string; text: string }[])}"`,
    },
    level,
  ));

  acts.push(makeActivity(
    'reading',
    'gapFill',
    `Read "${text2.title}" and answer: ${t2.questions[0].q}`,
    {
      sentence: `${t2.questions[0].q} ___`,
      options: shuffle([...t2.questions[0].options]),
      answer: t2.questions[0].answer,
      hint: level === 'easy' ? `It starts with "${t2.questions[0].answer[0]}".` : 'Find the key fact in the text.',
      why: `The text says: "${getTextSnippet(t2.text as string, t2.questions[0].answer)}"`,
    },
    level,
  ));

  return acts;
}

function getThreadSnippet(answer: string, thread: { speaker: string; text: string }[]): string {
  for (const line of thread) {
    const idx = line.text.toLowerCase().indexOf(answer.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(line.text.length, idx + answer.length + 30);
      return `${line.speaker}: ${line.text.slice(start, end).trim()}`;
    }
  }
  return thread[0]?.text.slice(0, 80) + '...';
}

function getTextSnippet(text: string, answer: string): string {
  const idx = text.toLowerCase().indexOf(answer.toLowerCase());
  if (idx === -1) return text.slice(0, 80) + '...';
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + answer.length + 30);
  return text.slice(start, end).trim();
}

function buildWritingActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const w = contentPack.writing[level];

  if (w.type === 'sentenceBuilder') {
    // Weighting contract: exactly 2 writing activities per level (ACTIVITY_COUNTS.writing)
    for (const item of w.items.slice(0, 2)) {
      acts.push(makeActivity(
        'writing',
        'sentenceBuilder',
        'Arrange the words to make a sentence.',
        {
          scrambled: shuffle(item.tiles),
          answer: item.answer,
          hint: `Start with "${item.tiles[0]}".`,
          why: `The correct sentence is: "${item.answer}"`,
        },
        level,
      ));
    }
  } else if (w.type === 'gapFillDiary') {
    acts.push(makeActivity(
      'writing',
      'gapFill',
      'Fill in the blank in this diary entry.',
      {
        sentence: w.template,
        options: shuffle(w.options || ['red', 'green', 'blue']),
        answer: w.answer || 'red',
        hint: 'Say the colour before the clothing word.',
        why: 'The colour comes BEFORE the clothing word.',
      },
      level,
    ));
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      'Write your own outfit diary entry.',
      {
        prompt: w.template,
        checklist: [
          'I filled in all the blanks',
          "I used I'm wearing / is wearing correctly",
          'I checked my spelling',
        ],
        wordBank: showWordBank(level) ? ["I'm wearing", "is wearing", "isn't wearing", 'red', 'blue', 'green', 'because', 'but'] : [],
        minLength: 2,
        hint: 'Use the template to write your own diary entry.',
      },
      level,
    ));
  } else if (w.type === 'diaryPrompt') {
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      w.prompt,
      {
        prompt: w.prompt,
        checklist: w.checklist,
        wordBank: showWordBank(level) ? ["I'm wearing", "He's wearing", "She's wearing", "isn't wearing", 'because', 'but'] : [],
        minLength: 5,
        minimumWords: w.minimumWords,
        hint: 'Start with "Today I\'m wearing..."',
      },
      level,
    ));
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      'Write about what your family is wearing today.',
      {
        prompt: 'Write 3 sentences about what your family members are wearing. Use He\'s wearing or She\'s wearing and a colour.',
        checklist: [
          'I wrote at least 3 sentences',
          'I mentioned at least 3 people',
          "I used He's / She's / They're wearing correctly",
        ],
        wordBank: showWordBank(level) ? ["He's wearing", "She's wearing", "They're wearing", "isn't wearing", 'because', 'but', 'and'] : [],
        minLength: 3,
        hint: 'Start with "My mother is wearing..."',
      },
      level,
    ));
  }

  return acts;
}

function buildSpeakingActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const tasks = speakingTasks[level];

  for (const task of tasks) {
    acts.push(makeActivity(
      'speaking',
      'recordAndCompare',
      task.prompt,
      {
        modelLine: task.modelLine,
        keywords: task.keywords,
        taskType: task.taskType,
        hint: task.hint || 'Say each word slowly and clearly.',
        minimumSeconds: task.minimumSeconds,
      },
      level,
    ));
  }

  return acts;
}

// boss.itemPlan -> the mixed checkpoint: one item from every skill, with the
// reading slot using the dialogue (story card) and the speaking slot using the
// dialogue as the roleplay source.
function buildBossActivities(level: Level): Activity[] {
  const pools: Record<string, Activity[]> = {
    vocabulary: buildVocabularyActivities(level),
    grammar: buildGrammarActivities(level),
    listening: buildListeningActivities(level),
    reading: buildReadingActivities(level),
    writing: buildWritingActivities(level),
    speaking: buildSpeakingActivities(level),
  };

  const acts: Activity[] = [];
  for (const [skill, count] of Object.entries(contentPack.boss.itemPlan)) {
    if (skill === 'reading') {
      // Dialogue comprehension — the story card shows the dialogue lines
      const q = dialogueComprehension(level)[0];
      if (q) {
        acts.push(makeActivity(
          'reading',
          'gapFill',
          `Listen to "${dialogue.title}" and answer: ${q.q}`,
          {
            sentence: `${q.q} ___`,
            options: shuffle([...q.options]),
            answer: q.answer,
            hint: level === 'easy' ? `It starts with "${q.answer[0]}".` : 'Listen to the dialogue carefully.',
            why: `From the dialogue "${dialogue.title}".`,
          },
          level,
        ));
      }
      continue;
    }
    if (skill === 'speaking') {
      // The dialogue is the roleplay source
      acts.push(makeActivity(
        'speaking',
        'recordAndCompare',
        `Read "${dialogue.title}" aloud with two voices: you are ${dialogue.cast[0]}, then you are ${dialogue.cast[1]}.`,
        {
          modelLine: dialogue.lines.map(l => `${l.speaker}: ${l.text}`).join(' '),
          keywords: ['wearing', 'soccer', 'sweatshirt', 'cold'],
          taskType: 'roleplay',
          hint: 'Say each line slowly and clearly.',
        },
        level,
      ));
      continue;
    }
    acts.push(...pools[skill].slice(0, count));
  }

  return acts;
}

function showWordBank(level: Level): boolean {
  return level !== 'challenging';
}

export function buildLevelActivities(level: Level): Activity[] {
  const vocab = buildVocabularyActivities(level);
  const grammar = buildGrammarActivities(level);
  const listening = buildListeningActivities(level);
  const reading = buildReadingActivities(level);
  const writing = buildWritingActivities(level);
  const speaking = buildSpeakingActivities(level);

  // wordSorts -> the DragSort activities of the Vocabulary station
  // (station mechanic: PictureMatch + DragSort)
  const sorts = buildWordSortActivities(level);
  sorts.forEach((sort, i) => {
    const idx = vocab.length - sorts.length + i;
    if (idx >= 0) vocab[idx] = sort;
  });

  return [...vocab, ...grammar, ...listening, ...reading, ...writing, ...speaking];
}

export function buildBossLevelActivities(level: Level): Activity[] {
  return buildBossActivities(level);
}

export function buildUnit2(): Unit {
  resetIdCounter();

  const levels: Record<Level, ReturnType<typeof buildLevelActivities>> = {
    easy: buildLevelActivities('easy'),
    core: buildLevelActivities('core'),
    challenging: buildLevelActivities('challenging'),
  };

  // Station keys and order are identical to Unit 1 — only the display
  // names (and subtitles as descriptions) come from this pack.
  const unit2Stations = contentPack.stations.map(s => ({
    id: s.id,
    name: s.name,
    skill: (s.skill === 'mixed' ? 'speaking' : s.skill) as Skill,
    order: s.order,
    description: s.subtitle || '',
  }));

  const entry = contentPack.unitRegistryEntry;

  return {
    id: entry.id,
    title: entry.title,
    islandName: entry.islandName,
    bigQuestion: entry.bigQuestion,
    objectives: entry.objectives,
    skills: SKILL_WEIGHTS,
    vocabulary,
    stations: unit2Stations,
    levels,
    bossActivities: {
      easy: buildBossLevelActivities('easy'),
      core: buildBossLevelActivities('core'),
      challenging: buildBossLevelActivities('challenging'),
    },
    // The pack ships unlocked: false; the registry wants Unit 2 reachable now.
    unlocked: true,
    status: 'playable',
  };
}
