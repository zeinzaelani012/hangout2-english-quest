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
      // audioToPicture — use PictureMatch with audio prompt
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

  const text1 = readingTexts[0];
  const text2 = readingTexts[1];
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
      hint: level === 'easy' ? `It starts with "${t1.questions[0].answer[0]}".` : 'Look in the text.',
      why: `The text says: "${getTextSnippet(t1.text, t1.questions[0].answer)}"`,
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
      hint: level === 'easy' ? `It starts with "${t1.questions[1].answer[0]}".` : 'Think about what the text tells you.',
      why: `The text says: "${getTextSnippet(t1.text, t1.questions[1].answer)}"`,
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
      why: `The text says: "${getTextSnippet(t2.text, t2.questions[0].answer)}"`,
    },
    level,
  ));

  return acts;
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
        options: shuffle(w.options || ['am', 'is', 'are']),
        answer: w.answer || 'am',
        hint: 'The sentence starts with "I".',
        why: 'The correct diary entry is: "' + w.template.replace('___', w.answer || 'am') + '"',
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
          'I used am, is or are correctly',
          'I checked my spelling',
        ],
        wordBank: showWordBank(level) ? ['am', 'is', 'are', "isn't", "aren't", 'wearing', 'because', 'but'] : [],
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
        wordBank: showWordBank(level) ? ['am', 'is', 'are', "isn't", "aren't", 'So am I', 'Neither am I', 'because', 'but'] : [],
        minLength: 5,
        minimumWords: w.minimumWords,
        hint: 'Start with "Today I am wearing..."',
      },
      level,
    ));
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      'Write about what your family is wearing today.',
      {
        prompt: 'Write 3 sentences about what your family members are wearing. Use am, is and are.',
        checklist: [
          'I wrote at least 3 sentences',
          'I mentioned at least 3 people',
          'I used am, is and are correctly',
        ],
        wordBank: showWordBank(level) ? ['is wearing', 'are wearing', 'am wearing', 'because', 'but', 'and'] : [],
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

function buildBossActivities(level: Level): Activity[] {
  const acts: Activity[] = [];
  const comprehension = dialogueComprehension(level);

  // Boss: dialogue comprehension questions + a speaking roleplay
  for (const q of comprehension) {
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

  // Add a speaking roleplay from the last speaking task
  const speakingActs = buildSpeakingActivities(level);
  if (speakingActs.length > 0) {
    const roleplay = speakingActs[speakingActs.length - 1];
    acts.push(roleplay);
  }

  return acts;
}

function buildDragSortActivity(level: Level): Activity {
  const items: Record<Level, { id: string; label: string; binId: string; imgHint: string }[]> = {
    easy: [
      { id: 'd1', label: 't-shirt', binId: 'hot', imgHint: 'blue t-shirt with short sleeves' },
      { id: 'd2', label: 'coat', binId: 'cold', imgHint: 'long navy coat with round buttons' },
      { id: 'd3', label: 'shorts', binId: 'hot', imgHint: 'yellow shorts with a waistband' },
      { id: 'd4', label: 'scarf', binId: 'cold', imgHint: 'purple striped scarf with hanging ends' },
    ],
    core: [
      { id: 'd1', label: 'swimsuit', binId: 'hot', imgHint: 'orange one-piece swimsuit' },
      { id: 'd2', label: 'sweater', binId: 'cold', imgHint: 'yellow knitted sweater with long sleeves' },
      { id: 'd3', label: 'skirt', binId: 'hot', imgHint: 'red pleated skirt' },
      { id: 'd4', label: 'gloves', binId: 'cold', imgHint: 'green glove with a cuff' },
      { id: 'd5', label: 'sunglasses', binId: 'hot', imgHint: 'round black glasses' },
      { id: 'd6', label: 'boots', binId: 'cold', imgHint: 'brown boot with a folded cuff' },
    ],
    challenging: [
      { id: 'd1', label: 'shorts', binId: 'hot', imgHint: 'yellow shorts with a waistband' },
      { id: 'd2', label: 'jacket', binId: 'cold', imgHint: 'grey jacket with pockets and a zipper' },
      { id: 'd3', label: 'hat', binId: 'hot', imgHint: 'red cap with a peak' },
      { id: 'd4', label: 'pajamas', binId: 'cold', imgHint: 'violet pajama top with a moon and stars' },
      { id: 'd5', label: 'socks', binId: 'hot', imgHint: 'red sock with a folded cuff' },
      { id: 'd6', label: 'belt', binId: 'cold', imgHint: 'brown belt with a golden buckle' },
    ],
  };

  return makeActivity(
    'vocabulary',
    'dragSort',
    'Sort the clothes into Hot Weather or Cold Weather.',
    {
      prompt: 'Drag each item of clothing into the right bin.',
      bins: [
        { id: 'hot', label: 'Hot weather', imgHint: 'bright sun' },
        { id: 'cold', label: 'Cold weather', imgHint: 'snowflake' },
      ],
      items: items[level],
      hint: level === 'easy'
        ? 'T-shirts and shorts are for hot weather. Coats and scarves are for cold weather.'
        : 'Think about which clothes keep you cool and which keep you warm.',
      why: 'In hot weather we wear light clothes like t-shirts and shorts. In cold weather we wear warm clothes like coats, sweaters and scarves.',
    },
    level,
  );
}

function buildReadingDragSortActivity(level: Level): Activity {
  const items: Record<Level, { id: string; label: string; binId: string; imgHint: string }[]> = {
    easy: [
      { id: 'r1', label: 'hat', binId: 'head', imgHint: 'red cap with a peak' },
      { id: 'r2', label: 'gloves', binId: 'hands', imgHint: 'green glove with a cuff' },
      { id: 'r3', label: 'socks', binId: 'feet', imgHint: 'red sock with a folded cuff' },
    ],
    core: [
      { id: 'r1', label: 'hat', binId: 'head', imgHint: 'red cap with a peak' },
      { id: 'r2', label: 'gloves', binId: 'hands', imgHint: 'green glove with a cuff' },
      { id: 'r3', label: 'socks', binId: 'feet', imgHint: 'red sock with a folded cuff' },
      { id: 'r4', label: 'boots', binId: 'feet', imgHint: 'brown boot with a folded cuff' },
    ],
    challenging: [
      { id: 'r1', label: 'hat', binId: 'head', imgHint: 'red cap with a peak' },
      { id: 'r2', label: 'gloves', binId: 'hands', imgHint: 'green glove with a cuff' },
      { id: 'r3', label: 'socks', binId: 'feet', imgHint: 'red sock with a folded cuff' },
      { id: 'r4', label: 'boots', binId: 'feet', imgHint: 'brown boot with a folded cuff' },
      { id: 'r5', label: 'glasses', binId: 'head', imgHint: 'round black glasses' },
    ],
  };

  return makeActivity(
    'reading',
    'dragSort',
    'Sort the clothes by where you wear them.',
    {
      prompt: 'Drag each item to the part of the body.',
      bins: [
        { id: 'head', label: 'On your head', imgHint: 'head with a hat' },
        { id: 'hands', label: 'On your hands', imgHint: 'open hand' },
        { id: 'feet', label: 'On your feet', imgHint: 'a foot in a sock' },
      ],
      items: items[level],
      hint: 'Hats go on your head. Gloves go on your hands. Socks and boots go on your feet.',
      why: 'Every item of clothing has its place: hats on the head, gloves on the hands, socks and boots on the feet.',
    },
    level,
  );
}

function buildStickerPlateActivity(level: Level): Activity {
  const stickers: Record<Level, { id: string; label: string; imgHint: string }[]> = {
    easy: [
      { id: 's1', label: 't-shirt', imgHint: 'blue t-shirt with short sleeves' },
      { id: 's2', label: 'shorts', imgHint: 'yellow shorts with a waistband' },
      { id: 's3', label: 'hat', imgHint: 'red cap with a peak' },
      { id: 's4', label: 'socks', imgHint: 'red sock with a folded cuff' },
    ],
    core: [
      { id: 's1', label: 't-shirt', imgHint: 'blue t-shirt with short sleeves' },
      { id: 's2', label: 'pants', imgHint: 'long blue pants' },
      { id: 's3', label: 'sweater', imgHint: 'yellow knitted sweater with long sleeves' },
      { id: 's4', label: 'boots', imgHint: 'brown boot with a folded cuff' },
      { id: 's5', label: 'skirt', imgHint: 'red pleated skirt' },
    ],
    challenging: [
      { id: 's1', label: 'dress', imgHint: 'purple dress with thin straps' },
      { id: 's2', label: 'jacket', imgHint: 'grey jacket with pockets and a zipper' },
      { id: 's3', label: 'scarf', imgHint: 'purple striped scarf with hanging ends' },
      { id: 's4', label: 'boots', imgHint: 'brown boot with a folded cuff' },
      { id: 's5', label: 'belt', imgHint: 'brown belt with a golden buckle' },
      { id: 's6', label: 'hat', imgHint: 'red cap with a peak' },
    ],
  };

  const speakingPrompts: Record<Level, string> = {
    easy: 'Look at your outfit. Say: "I am wearing ___ and ___."',
    core: 'Describe your outfit: "I am wearing ___. I am not wearing ___."',
    challenging: 'Talk about your outfit for 20 seconds: "I am wearing... because... I am not wearing... because..."',
  };

  return makeActivity(
    'speaking',
    'stickerPlate',
    'Build your outfit, then describe it.',
    {
      prompt: 'Drag clothing stickers onto your outfit.',
      stickers: stickers[level],
      speakingPrompt: speakingPrompts[level],
      hint: 'Drag at least 3 items onto your outfit, then say your sentence.',
    },
    level,
  );
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

  // Replace one vocabulary activity with a DragSort for variety
  if (vocab.length >= 2) {
    vocab[1] = buildDragSortActivity(level);
  }

  // Replace one speaking activity with a StickerPlate
  if (speaking.length >= 4) {
    speaking[3] = buildStickerPlateActivity(level);
  }

  // Replace one reading with a DragSort for the "Uniforms Around the World" text
  if (reading.length >= 3) {
    reading[2] = buildReadingDragSortActivity(level);
  }

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

  const unit2Stations = contentPack.stations.map(s => ({
    id: s.id,
    name: s.name,
    skill: (s.skill === 'mixed' ? 'speaking' : s.skill) as Skill,
    order: s.order,
    description: s.note || '',
  }));

  return {
    id: 2,
    title: 'What Are You Wearing?',
    islandName: 'Wardrobe World',
    bigQuestion: 'What are you wearing?',
    objectives: ['Clothing words', 'Saying what people are wearing with am / is / are'],
    skills: SKILL_WEIGHTS,
    vocabulary,
    stations: unit2Stations,
    levels,
    bossActivities: {
      easy: buildBossLevelActivities('easy'),
      core: buildBossLevelActivities('core'),
      challenging: buildBossLevelActivities('challenging'),
    },
    unlocked: true,
    status: 'playable',
  };
}
