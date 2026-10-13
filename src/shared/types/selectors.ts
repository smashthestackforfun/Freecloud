export type SelectorStrategyType =
  | 'test-id'
  | 'aria'
  | 'role-text'
  | 'form-attr'
  | 'structural';

export interface SelectorStrategy {
  type: SelectorStrategyType;
  value: string;
  confidence: number;
}

export type SelectorChain = SelectorStrategy[];
