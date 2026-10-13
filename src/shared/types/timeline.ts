import type { SelectorChain } from './selectors';

export interface BaseEvent {
  id: string;
  timestamp: number;
  frameId?: number;
  relatedActionId?: string;
}

export interface PreConditions {
  visible: boolean;
  enabled: boolean;
  expectedParentText?: string;
}

export interface WaitForCondition {
  type: 'element_attached' | 'element_removed' | 'text_content';
  selectorChain: SelectorChain;
  timeout: number;
  expectedText?: string;
}

export type UserActionType = 'click' | 'type' | 'select' | 'submit' | 'keypress';

export interface UserActionEvent extends BaseEvent {
  type: 'USER_ACTION';
  action: UserActionType;
  selectorChain: SelectorChain;
  text?: string;
  textValue?: string;
  keyCode?: string;
  preConditions: PreConditions;
  waitFor?: WaitForCondition;
}

export type MutationType = 'childList' | 'attributes' | 'characterData';

export interface DomMutationEvent extends BaseEvent {
  type: 'DOM_MUTATION';
  targetSelector: string;
  mutationType: MutationType;
  addedText?: string;
  removedText?: string;
  attributeName?: string;
  oldValue?: string;
  newValue?: string;
}

export interface NetworkRequestEvent extends BaseEvent {
  type: 'NETWORK_REQUEST';
  requestId: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
}

export interface NetworkResponseEvent extends BaseEvent {
  type: 'NETWORK_RESPONSE';
  requestId: string;
  url: string;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  mimeType?: string;
  truncated?: boolean;
}

export interface NavigationEvent extends BaseEvent {
  type: 'NAVIGATION';
  url: string;
  transitionType: string;
}

export type TimelineEvent =
  | UserActionEvent
  | DomMutationEvent
  | NetworkRequestEvent
  | NetworkResponseEvent
  | NavigationEvent;

export type TimelineEventType = TimelineEvent['type'];
