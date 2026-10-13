import type { PreConditions } from '@shared/types/timeline';

export function capturePreConditions(element: Element): PreConditions {
  const htmlEl = element as HTMLElement;

  const visible = htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0;
  const enabled = !(htmlEl as HTMLInputElement).disabled;

  let expectedParentText: string | undefined;
  const parent = findMeaningfulParent(element);
  if (parent) {
    const text = (parent.textContent ?? '').trim().replace(/\s+/g, ' ');
    if (text.length > 0 && text.length <= 100) {
      expectedParentText = text;
    }
  }

  return { visible, enabled, expectedParentText };
}

function findMeaningfulParent(el: Element): Element | null {
  let current = el.parentElement;
  const meaningfulTags = new Set([
    'LI', 'ARTICLE', 'SECTION', 'NAV', 'HEADER', 'FOOTER',
    'FORM', 'FIELDSET', 'DETAILS', 'DIALOG',
  ]);

  while (current && current !== document.body) {
    if (meaningfulTags.has(current.tagName)) return current;
    if (current.getAttribute('role')) return current;
    if (current.id) return current;
    current = current.parentElement;
  }
  return null;
}
