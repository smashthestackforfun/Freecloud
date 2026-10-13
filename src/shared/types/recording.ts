import type { TimelineEvent } from './timeline';

export interface MacroParameter {
  name: string;
  actionId: string;
  defaultValue: string;
  description?: string;
}

export interface DynamicToken {
  name: string;
  source: 'cookie' | 'header' | 'localStorage' | 'sessionStorage';
  key: string;
  pattern?: string;
}

export interface FastPathRecipe {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyTemplate?: string;
  dynamicTokens: DynamicToken[];
  expectedStatus: number;
}

export interface Macro {
  id: string;
  name: string;
  createdAt: string;
  recorderVersion: string;
  startUrl: string;
  timeline: TimelineEvent[];
  parameters: MacroParameter[];
  fastPathRecipe?: FastPathRecipe;
}

export const RECORDER_VERSION = '0.1.0';
