import { describe, it, expect, beforeEach } from 'vitest';
import { generateSelectorChain, resolveSelector } from '../../src/content/recorder/selector-generator';

describe('generateSelectorChain', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('prioritizes data-testid attributes', () => {
    document.body.innerHTML = '<button data-testid="submit-btn">Submit</button>';
    const el = document.querySelector('button')!;
    const chain = generateSelectorChain(el);

    expect(chain.length).toBeGreaterThan(0);
    expect(chain[0].type).toBe('test-id');
    expect(chain[0].confidence).toBe(0.95);
    expect(chain[0].value).toContain('data-testid');
  });

  it('falls back to aria-label', () => {
    document.body.innerHTML = '<button aria-label="Close dialog">X</button>';
    const el = document.querySelector('button')!;
    const chain = generateSelectorChain(el);

    const ariaStrategy = chain.find((s) => s.type === 'aria');
    expect(ariaStrategy).toBeDefined();
    expect(ariaStrategy!.confidence).toBe(0.85);
  });

  it('generates form attribute selectors for inputs', () => {
    document.body.innerHTML = '<input name="username" type="text" />';
    const el = document.querySelector('input')!;
    const chain = generateSelectorChain(el);

    const formStrategy = chain.find((s) => s.type === 'form-attr');
    expect(formStrategy).toBeDefined();
    expect(formStrategy!.value).toContain('name=');
  });

  it('includes structural fallback', () => {
    document.body.innerHTML = '<div><span>hello</span></div>';
    const el = document.querySelector('span')!;
    const chain = generateSelectorChain(el);

    const structural = chain.find((s) => s.type === 'structural');
    expect(structural).toBeDefined();
    expect(structural!.confidence).toBeLessThanOrEqual(0.4);
  });

  it('handles multiple test-id attributes', () => {
    document.body.innerHTML = `
      <button data-testid="btn-1">One</button>
      <button data-test="btn-2">Two</button>
    `;
    const el = document.querySelector('[data-test="btn-2"]')!;
    const chain = generateSelectorChain(el);

    expect(chain[0].type).toBe('test-id');
    expect(chain[0].value).toContain('data-test');
  });
});

describe('resolveSelector', () => {
  it('resolves from a SelectorChain in order', () => {
    document.body.innerHTML = '<button data-testid="my-btn">Click</button>';
    const el = document.querySelector('button')!;
    const chain = generateSelectorChain(el);

    const resolved = resolveSelector(chain);
    expect(resolved).toBe(el);
  });

  it('falls back to lower-confidence strategies', () => {
    document.body.innerHTML = '<input name="email" type="text" />';
    const el = document.querySelector('input')!;
    const chain = generateSelectorChain(el);

    const resolved = resolveSelector(chain);
    expect(resolved).toBe(el);
  });

  it('returns null for empty chain', () => {
    const resolved = resolveSelector([]);
    expect(resolved).toBeNull();
  });
});
