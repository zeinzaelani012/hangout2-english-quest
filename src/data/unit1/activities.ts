import type { Activity, Level, VocabItem } from '../../types';
import { vocabulary } from './vocabulary';
import { readingTexts, dialogue, dialogueComprehension } from './reading';
import { grammarGapFill } from './grammar';
import { speakingTasks } from './speaking';
import { contentPack } from './contentPack';
import {
  makeActivity, getDistractors, optionCount, shuffle, showPictures,
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
      'Fill in the blanks in this diary entry.',
      {
        sentence: w.template,
        options: shuffle(['eat', 'like', "don't like", 'likes', "doesn't like", 'So do I', 'Neither do I']),
        answer: 'eat',
        hint: 'Think about what you eat and what you like.',
        why: 'Use your own words to complete the diary.',
      },
      level,
    ));
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      'Write your own snack diary entry.',
      {
        prompt: w.template,
        checklist: [
          'I filled in all the blanks',
          'I used "like" or "don\'t like" correctly',
          'I checked my spelling',
        ],
        wordBank: ['like', "don't like", 'likes', "doesn't like", 'So do I', 'Neither do I'],
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
        wordBank: showWordBank(level) ? ['like', "don't like", 'likes', "doesn't like", 'So do I', 'Neither do I', 'because', 'but', 'on trees', 'on vines', 'on the ground'] : [],
        minLength: 5,
        minimumWords: w.minimumWords,
        hint: 'Start with "Today..." or "At the party..."',
      },
      level,
    ));
    acts.push(makeActivity(
      'writing',
      'diaryPrompt',
      'Write about where fruit grows.',
      {
        prompt: 'Write 3 sentences about where different fruits grow. Use words from the word bank.',
        checklist: [
          'I wrote at least 3 sentences',
          'I mentioned at least 3 different fruits',
          'I used "on trees", "on vines", or "on the ground"',
        ],
        wordBank: showWordBank(level) ? ['on trees', 'on vines', 'on the ground', 'grow', 'farm', 'garden', 'because', 'but'] : [],
        minLength: 3,
        hint: 'Start with "Fruit grows in different places."',
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
      { id: 'd1', label: 'cookies', binId: 'unhealthy', imgHint: 'round cookies with chocolate chips' },
      { id: 'd2', label: 'apples', binId: 'healthy', imgHint: 'red apple with green leaf' },
      { id: 'd3', label: 'soda', binId: 'unhealthy', imgHint: 'fizzy drink in a glass' },
      { id: 'd4', label: 'milk', binId: 'healthy', imgHint: 'glass of white milk' },
    ],
    core: [
      { id: 'd1', label: 'popcorn', binId: 'unhealthy', imgHint: 'striped box of popcorn' },
      { id: 'd2', label: 'yogurt', binId: 'healthy', imgHint: 'cup of white yogurt' },
      { id: 'd3', label: 'candy', binId: 'unhealthy', imgHint: 'colorful wrapped candy' },
      { id: 'd4', label: 'bananas', binId: 'healthy', imgHint: 'bunch of yellow bananas' },
      { id: 'd5', label: 'fries', binId: 'unhealthy', imgHint: 'golden potato sticks' },
      { id: 'd6', label: 'vegetables', binId: 'healthy', imgHint: 'carrots and broccoli' },
    ],
    challenging: [
      { id: 'd1', label: 'chocolate', binId: 'unhealthy', imgHint: 'brown chocolate bar' },
      { id: 'd2', label: 'fruit', binId: 'healthy', imgHint: 'bowl of mixed fruit' },
      { id: 'd3', label: 'soda', binId: 'unhealthy', imgHint: 'fizzy drink' },
      { id: 'd4', label: 'rice', binId: 'healthy', imgHint: 'bowl of white rice' },
      { id: 'd5', label: 'cookies', binId: 'unhealthy', imgHint: 'cookies with chips' },
      { id: 'd6', label: 'tomatoes', binId: 'healthy', imgHint: 'red tomatoes on vine' },
    ],
  };

  return makeActivity(
    'vocabulary',
    'dragSort',
    'Sort the food into Healthy or Unhealthy.',
    {
      prompt: 'Drag each food into the right bin.',
      bins: [
        { id: 'healthy', label: 'Healthy', imgHint: 'green check' },
        { id: 'unhealthy', label: 'Unhealthy', imgHint: 'orange triangle' },
      ],
      items: items[level],
      hint: level === 'easy' ? 'Fruit and milk are healthy. Soda and cookies are unhealthy.' : 'Think about which foods give you energy and which are just sweet treats.',
      why: 'Healthy foods like fruit, vegetables, and milk give your body what it needs. Unhealthy foods like soda, candy, and fries are fine sometimes but not every day.',
    },
    level,
  );
}

function buildReadingDragSortActivity(level: Level): Activity {
  const items: Record<Level, { id: string; label: string; binId: string; imgHint: string }[]> = {
    easy: [
      { id: 'r1', label: 'apples', binId: 'tree', imgHint: 'red apple' },
      { id: 'r2', label: 'tomatoes', binId: 'vine', imgHint: 'tomato on vine' },
      { id: 'r3', label: 'watermelons', binId: 'ground', imgHint: 'big green watermelon' },
    ],
    core: [
      { id: 'r1', label: 'apples', binId: 'tree', imgHint: 'red apple' },
      { id: 'r2', label: 'tomatoes', binId: 'vine', imgHint: 'tomato on vine' },
      { id: 'r3', label: 'watermelons', binId: 'ground', imgHint: 'watermelon' },
      { id: 'r4', label: 'bananas', binId: 'tree', imgHint: 'yellow bananas' },
    ],
    challenging: [
      { id: 'r1', label: 'apples', binId: 'tree', imgHint: 'red apple' },
      { id: 'r2', label: 'tomatoes', binId: 'vine', imgHint: 'tomato on vine' },
      { id: 'r3', label: 'watermelons', binId: 'ground', imgHint: 'watermelon' },
      { id: 'r4', label: 'bananas', binId: 'tree', imgHint: 'yellow bananas' },
      { id: 'r5', label: 'grapes', binId: 'vine', imgHint: 'purple grapes on vine' },
    ],
  };

  return makeActivity(
    'reading',
    'dragSort',
    'Sort the fruit by where it grows.',
    {
      prompt: 'Drag each fruit to where it grows.',
      bins: [
        { id: 'tree', label: 'On a tree', imgHint: 'tree with fruit' },
        { id: 'vine', label: 'On a vine', imgHint: 'vine with tendrils' },
        { id: 'ground', label: 'On the ground', imgHint: 'soil patch' },
      ],
      items: items[level],
      hint: 'Apples and bananas grow on trees. Tomatoes grow on vines. Watermelons grow on the ground.',
      why: 'Each fruit grows in a different place: trees, vines, or the ground.',
    },
    level,
  );
}

function buildStickerPlateActivity(level: Level): Activity {
  const stickers: Record<Level, { id: string; label: string; imgHint: string }[]> = {
    easy: [
      { id: 's1', label: 'apple', imgHint: 'red apple' },
      { id: 's2', label: 'cookie', imgHint: 'round cookie' },
      { id: 's3', label: 'banana', imgHint: 'yellow banana' },
      { id: 's4', label: 'milk', imgHint: 'glass of milk' },
    ],
    core: [
      { id: 's1', label: 'popcorn', imgHint: 'striped popcorn box' },
      { id: 's2', label: 'yogurt', imgHint: 'yogurt cup' },
      { id: 's3', label: 'apple', imgHint: 'red apple' },
      { id: 's4', label: 'chocolate', imgHint: 'chocolate bar' },
      { id: 's5', label: 'banana', imgHint: 'yellow banana' },
    ],
    challenging: [
      { id: 's1', label: 'popcorn', imgHint: 'popcorn box' },
      { id: 's2', label: 'apple', imgHint: 'red apple' },
      { id: 's3', label: 'yogurt', imgHint: 'yogurt cup' },
      { id: 's4', label: 'cookies', imgHint: 'cookies' },
      { id: 's5', label: 'fruit', imgHint: 'fruit bowl' },
      { id: 's6', label: 'juice', imgHint: 'glass of juice' },
    ],
  };

  const speakingPrompts: Record<Level, string> = {
    easy: 'Look at your plate. Say: "I have ___ and ___ on my plate."',
    core: 'Describe your plate: "On my plate, I have ___. I like ___ but I don\'t like ___."',
    challenging: 'Talk about your plate for 20 seconds: "On my snack plate, I have... I like... because... I don\'t like... because..."',
  };

  return makeActivity(
    'speaking',
    'stickerPlate',
    'Build your snack plate, then describe it.',
    {
      prompt: 'Drag food stickers onto your plate.',
      stickers: stickers[level],
      speakingPrompt: speakingPrompts[level],
      hint: 'Drag at least 3 items onto your plate, then say your sentence.',
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

  // Replace one reading with a DragSort for the "Where Does Fruit Grow" text
  if (reading.length >= 3) {
    reading[2] = buildReadingDragSortActivity(level);
  }

  return [...vocab, ...grammar, ...listening, ...reading, ...writing, ...speaking];
}

export function buildBossLevelActivities(level: Level): Activity[] {
  return buildBossActivities(level);
}
