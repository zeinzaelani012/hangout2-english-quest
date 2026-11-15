import type { VocabItem } from '../../types';
import { contentPack } from './contentPack';

export const vocabulary: VocabItem[] = contentPack.vocabulary.map(v => ({
  id: v.id,
  word: v.word,
  set: v.set,
  category: v.category as VocabItem['category'],
  example: v.example,
  imgHint: v.imgHint,
}));
