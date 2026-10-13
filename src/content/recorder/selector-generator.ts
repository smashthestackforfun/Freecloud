import type { SelectorChain, SelectorStrategy } from '@shared/types/selectors';

const TEST_ID_ATTRS = ['data-testid', 'data-test', 'data-qa', 'data-cy'];
const ARIA_ATTRS = ['aria-label', 'aria-labelledby'];
const MAX_TEXT_LENGTH = 30;

export function generateSelectorChain(element: Element): SelectorChain {
  const strategies: SelectorStrategy[] = [];

  const testId = tryTestId(element);
  if (testId) strategies.push(testId);

  const aria = tryAria(element);
  if (aria) strategies.push(aria);

  const roleText = tryRoleText(element);
  if (roleText) strategies.push(roleText);

  const formAttr = tryFormAttr(element);
  if (formAttr) strategies.push(formAttr);

  const structural = tryStructural(element);
  if (structural) strategies.push(structural);

  return strategies;
}

function tryTestId(el: Element): SelectorStrategy | null {
  for (const attr of TEST_ID_ATTRS) {
    const value = el.getAttribute(attr);
    if (value) {
      const selector = `[${attr}="${CSS.escape(value)}"]`;
      if (isUnique(selector, el)) {
        return { type: 'test-id', value: selector, confidence: 0.95 };
      }
    }
  }
  return null;
}

function tryAria(el: Element): SelectorStrategy | null {
  for (const attr of ARIA_ATTRS) {
    const value = el.getAttribute(attr);
    if (value) {
      const selector = `[${attr}="${CSS.escape(value)}"]`;
      if (isUnique(selector, el)) {
        return { type: 'aria', value: selector, confidence: 0.85 };
      }
    }
  }
  return null;
}

function tryRoleText(el: Element): SelectorStrategy | null {
  const role = el.getAttribute('role');
  const text = getVisibleText(el);
  if (!role || !text || text.length > MAX_TEXT_LENGTH) return null;

  const selector = `[role="${role}"]`;
  const candidates = document.querySelectorAll(selector);
  for (const candidate of candidates) {
    if (candidate === el && getVisibleText(candidate) === text) {
      return {
        type: 'role-text',
        value: `${selector}:has-text("${text}")`,
        confidence: 0.75,
      };
    }
  }
  return null;
}

function tryFormAttr(el: Element): SelectorStrategy | null {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const name = el.getAttribute('name');
    if (name) {
      const tag = el.tagName.toLowerCase();
      const selector = `${tag}[name="${CSS.escape(name)}"]`;
      if (isUnique(selector, el)) {
        return { type: 'form-attr', value: selector, confidence: 0.7 };
      }
    }

    const placeholder = el.getAttribute('placeholder');
    if (placeholder) {
      const tag = el.tagName.toLowerCase();
      const selector = `${tag}[placeholder="${CSS.escape(placeholder)}"]`;
      if (isUnique(selector, el)) {
        return { type: 'form-attr', value: selector, confidence: 0.65 };
      }
    }
  }
  return null;
}

function tryStructural(el: Element): SelectorStrategy | null {
  const path: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const id = current.id;
    if (id) {
      path.unshift(`#${CSS.escape(id)}`);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const currentTag = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === currentTag,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${tag}:nth-of-type(${index})`);
      } else {
        path.unshift(tag);
      }
    } else {
      path.unshift(tag);
    }

    current = parent;
  }

  const selector = path.join(' > ');
  if (selector && isUnique(selector, el)) {
    return { type: 'structural', value: selector, confidence: 0.4 };
  }
  return { type: 'structural', value: selector, confidence: 0.3 };
}

function isUnique(selector: string, expected: Element): boolean {
  try {
    const match = document.querySelector(selector);
    return match === expected;
  } catch {
    return false;
  }
}

function getVisibleText(el: Element): string {
  return (el.textContent ?? '').trim().replace(/\s+/g, ' ');
}

export function resolveSelector(chain: SelectorChain): Element | null {
  for (const strategy of chain) {
    if (strategy.type === 'role-text') {
      const match = resolveRoleText(strategy.value);
      if (match) return match;
      continue;
    }
    try {
      const el = document.querySelector(strategy.value);
      if (el) return el;
    } catch {
      continue;
    }
  }
  return null;
}

function resolveRoleText(selector: string): Element | null {
  const match = selector.match(/^(.+?):has-text\("(.+)"\)$/);
  if (!match) return null;
  const [, cssSelector, text] = match;
  const candidates = document.querySelectorAll(cssSelector);
  for (const el of candidates) {
    if (getVisibleText(el) === text) return el;
  }
  return null;
}
