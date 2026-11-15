import type { VocabItem } from '../../types';
import { contentPack } from './contentPack';

// Runtime ids are prefixed so they never collide with Unit 1's ids in
// vocabMastery and activity payloads — the pack file itself stays verbatim.
export const vocabulary: VocabItem[] = contentPack.vocabulary.map(v => ({
  id: `u2-${v.id}`,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));
