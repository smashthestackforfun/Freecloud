import type { UserActionEvent } from '@shared/types/timeline';
import { generateSelectorChain } from './selector-generator';
import { capturePreConditions } from './precondition-capture';
import { sendMessage } from '@shared/message-bus';
import { generateId, now } from '@shared/utils';

type ArmMutationObserver = () => void;

export class EventListenerManager {
  private armMutations: ArmMutationObserver;
  private abortController: AbortController | null = null;

  constructor(armMutations: ArmMutationObserver) {
    this.armMutations = armMutations;
  }

  start(): void {
    this.abortController = new AbortController();
    const opts = { capture: true, signal: this.abortController.signal };

    document.addEventListener('click', this.handleClick, opts);
    document.addEventListener('input', this.handleInput, opts);
    document.addEventListener('change', this.handleChange, opts);
    document.addEventListener('keydown', this.handleKeydown, opts);
    document.addEventListener('submit', this.handleSubmit, opts);
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private handleClick = (e: Event): void => {
    const target = e.target as Element;
    if (!target || !target.tagName) return;

    const event: UserActionEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'USER_ACTION',
      action: 'click',
      selectorChain: generateSelectorChain(target),
      text: getElementText(target),
      preConditions: capturePreConditions(target),
    };

    this.armMutations();
    sendMessage({ type: 'USER_ACTION', payload: event });
  };

  private handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || !('value' in target)) return;

    const event: UserActionEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'USER_ACTION',
      action: 'type',
      selectorChain: generateSelectorChain(target),
      textValue: target.value,
      preConditions: capturePreConditions(target),
    };

    sendMessage({ type: 'USER_ACTION', payload: event });
  };

  private handleChange = (e: Event): void => {
    const target = e.target as HTMLSelectElement;
    if (!(target instanceof HTMLSelectElement)) return;

    const event: UserActionEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'USER_ACTION',
      action: 'select',
      selectorChain: generateSelectorChain(target),
      textValue: target.value,
      text: target.options[target.selectedIndex]?.text,
      preConditions: capturePreConditions(target),
    };

    this.armMutations();
    sendMessage({ type: 'USER_ACTION', payload: event });
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Enter' && e.key !== 'Tab' && e.key !== 'Escape') return;
    const target = e.target as Element;
    if (!target) return;

    const event: UserActionEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'USER_ACTION',
      action: 'keypress',
      selectorChain: generateSelectorChain(target),
      keyCode: e.key,
      preConditions: capturePreConditions(target),
    };

    if (e.key === 'Enter') this.armMutations();
    sendMessage({ type: 'USER_ACTION', payload: event });
  };

  private handleSubmit = (e: Event): void => {
    const target = e.target as HTMLFormElement;
    if (!(target instanceof HTMLFormElement)) return;

    const event: UserActionEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'USER_ACTION',
      action: 'submit',
      selectorChain: generateSelectorChain(target),
      preConditions: capturePreConditions(target),
    };

    this.armMutations();
    sendMessage({ type: 'USER_ACTION', payload: event });
  };
}

function getElementText(el: Element): string | undefined {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  if (text.length > 0 && text.length <= 50) return text;
  return el.getAttribute('aria-label') ?? undefined;
}
