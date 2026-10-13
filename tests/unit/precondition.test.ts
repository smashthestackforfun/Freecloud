import { describe, it, expect, beforeEach } from 'vitest';
import { capturePreConditions } from '../../src/content/recorder/precondition-capture';

describe('capturePreConditions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects visible elements', () => {
    document.body.innerHTML = '<button>Click me</button>';
    const el = document.querySelector('button')!;
    Object.defineProperty(el, 'offsetWidth', { value: 100 });
    Object.defineProperty(el, 'offsetHeight', { value: 40 });

    const conditions = capturePreConditions(el);
    expect(conditions.visible).toBe(true);
  });

  it('detects hidden elements', () => {
    document.body.innerHTML = '<button style="display:none">Click me</button>';
    const el = document.querySelector('button')!;
    Object.defineProperty(el, 'offsetWidth', { value: 0 });
    Object.defineProperty(el, 'offsetHeight', { value: 0 });

    const conditions = capturePreConditions(el);
    expect(conditions.visible).toBe(false);
  });

  it('detects enabled elements', () => {
    document.body.innerHTML = '<input type="text" />';
    const el = document.querySelector('input')!;

    const conditions = capturePreConditions(el);
    expect(conditions.enabled).toBe(true);
  });

  it('detects disabled elements', () => {
    document.body.innerHTML = '<input type="text" disabled />';
    const el = document.querySelector('input')!;

    const conditions = capturePreConditions(el);
    expect(conditions.enabled).toBe(false);
  });

  it('captures parent text from semantic elements', () => {
    document.body.innerHTML = `
      <article>
        <p>Article content</p>
        <button>Like</button>
      </article>
    `;
    const el = document.querySelector('button')!;
    Object.defineProperty(el, 'offsetWidth', { value: 60 });
    Object.defineProperty(el, 'offsetHeight', { value: 30 });

    const conditions = capturePreConditions(el);
    expect(conditions.expectedParentText).toBeDefined();
  });
});
