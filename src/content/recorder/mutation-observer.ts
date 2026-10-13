import type { DomMutationEvent, WaitForCondition } from '@shared/types/timeline';
import type { SelectorChain } from '@shared/types/selectors';
import { generateSelectorChain } from './selector-generator';
import { sendMessage } from '@shared/message-bus';
import { generateId, now } from '@shared/utils';
import { MUTATION_DEBOUNCE_MS, MUTATION_TIMEOUT_MS, SENTINEL_SELECTORS } from '@shared/constants';

const IGNORED_ATTRIBUTES = new Set([
  'style', 'class', 'data-reactid', 'data-react-checksum',
]);
const MEANINGFUL_ATTRIBUTES = new Set([
  'disabled', 'hidden', 'aria-hidden', 'aria-expanded',
  'aria-selected', 'aria-checked', 'aria-disabled',
]);

export class DomMutationTracker {
  private observer: MutationObserver | null = null;
  private batchedMutations: MutationRecord[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private armed = false;
  private disarmTimeout: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    this.observer = new MutationObserver((mutations) => {
      if (!this.armed) return;
      this.batchedMutations.push(...mutations);
      this.scheduleBatchProcess();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...MEANINGFUL_ATTRIBUTES],
      characterData: true,
    });
  }

  arm(): void {
    this.armed = true;
    if (this.disarmTimeout) clearTimeout(this.disarmTimeout);
    this.disarmTimeout = setTimeout(() => {
      this.armed = false;
      this.batchedMutations = [];
    }, MUTATION_TIMEOUT_MS);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.batchTimeout) clearTimeout(this.batchTimeout);
    if (this.disarmTimeout) clearTimeout(this.disarmTimeout);
    this.batchedMutations = [];
    this.armed = false;
  }

  private scheduleBatchProcess(): void {
    if (this.batchTimeout) return;
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processBatch();
    }, MUTATION_DEBOUNCE_MS);
  }

  private processBatch(): void {
    const mutations = this.batchedMutations;
    this.batchedMutations = [];

    for (const mutation of mutations) {
      if (!this.isMeaningful(mutation)) continue;

      const target = mutation.target instanceof Element
        ? mutation.target
        : mutation.target.parentElement;
      if (!target) continue;

      const event: DomMutationEvent = {
        id: generateId(),
        timestamp: now(),
        type: 'DOM_MUTATION',
        targetSelector: generateSelectorChain(target)[0]?.value ?? '',
        mutationType: mutation.type as DomMutationEvent['mutationType'],
      };

      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0) {
          event.addedText = this.extractText(mutation.addedNodes);
        }
        if (mutation.removedNodes.length > 0) {
          event.removedText = this.extractText(mutation.removedNodes);
        }
      } else if (mutation.type === 'attributes') {
        event.attributeName = mutation.attributeName ?? undefined;
        event.oldValue = mutation.oldValue ?? undefined;
        event.newValue = target.getAttribute(mutation.attributeName ?? '') ?? undefined;
      }

      sendMessage({ type: 'DOM_MUTATION', payload: event });
    }

    const sentinel = this.findSentinel();
    if (sentinel) {
      const waitFor: WaitForCondition = {
        type: 'element_attached',
        selectorChain: sentinel,
        timeout: 10000,
      };
      // attach waitFor to the last user action via background correlation
      void waitFor;
    }
  }

  private isMeaningful(mutation: MutationRecord): boolean {
    if (mutation.type === 'attributes') {
      const attr = mutation.attributeName ?? '';
      if (IGNORED_ATTRIBUTES.has(attr)) return false;
      if (!MEANINGFUL_ATTRIBUTES.has(attr)) return false;
      return true;
    }

    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (this.hasTextContent(node)) return true;
      }
      for (const node of mutation.removedNodes) {
        if (this.hasTextContent(node)) return true;
      }
      return false;
    }

    return true;
  }

  private hasTextContent(node: Node): boolean {
    const text = (node.textContent ?? '').trim();
    return text.length > 0;
  }

  private extractText(nodes: NodeList): string {
    const texts: string[] = [];
    for (const node of nodes) {
      const text = (node.textContent ?? '').trim();
      if (text) texts.push(text.slice(0, 200));
    }
    return texts.join(' | ').slice(0, 500);
  }

  private findSentinel(): SelectorChain | null {
    for (const selector of SENTINEL_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return generateSelectorChain(el);
    }
    return null;
  }
}
