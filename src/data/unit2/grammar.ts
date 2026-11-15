import type { Level } from '../../types';
import { contentPack } from './contentPack';
import type { GrammarGapFillItem, GrammarPatternJSON } from './contentPack';

export type { GrammarGapFillItem, GrammarPatternJSON };

export function grammarGapFill(level: Level): GrammarGapFillItem[] {
  return contentPack.grammar.gapFillBank[level];
}

export const grammarPatterns: GrammarPatternJSON[] = contentPack.grammar.patterns;
