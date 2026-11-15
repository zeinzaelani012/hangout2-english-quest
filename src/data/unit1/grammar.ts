import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type { GrammarGapFillItem } from './contentPack';

export type { GrammarGapFillItem };

export function grammarGapFill(level: Level): GrammarGapFillItem[] {
  return contentPack.grammar.gapFillBank[level];
}

export const grammarPatterns = contentPack.grammar.patterns;
