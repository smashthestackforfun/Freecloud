import {
  HUMAN_TYPE_MIN_MS,
  HUMAN_TYPE_MAX_MS,
  HUMAN_DELAY_MIN_MS,
  HUMAN_DELAY_MAX_MS,
} from '@shared/constants';
import { randomBetween, sleep } from '@shared/utils';

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set;
const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value',
)?.set;

export async function simulateHumanType(element: Element, text: string): Promise<void> {
  const el = element as HTMLInputElement | HTMLTextAreaElement;
  el.focus();

  const setter = el instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter;

  for (let i = 0; i < text.length; i++) {
    const partial = text.slice(0, i + 1);

    if (setter) {
      setter.call(el, partial);
    } else {
      el.value = partial;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));

    const delay = randomBetween(HUMAN_TYPE_MIN_MS, HUMAN_TYPE_MAX_MS);
    await sleep(delay);
  }

  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export async function simulateHumanClick(element: Element): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = rect.left + randomBetween(rect.width * 0.2, rect.width * 0.8);
  const y = rect.top + randomBetween(rect.height * 0.2, rect.height * 0.8);

  const eventInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  };

  element.dispatchEvent(new MouseEvent('mousedown', eventInit));
  await sleep(randomBetween(30, 80));
  element.dispatchEvent(new MouseEvent('mouseup', eventInit));
  element.dispatchEvent(new MouseEvent('click', eventInit));
}

export async function simulateSelect(element: Element, value: string): Promise<void> {
  const select = element as HTMLSelectElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;

  if (setter) {
    setter.call(select, value);
  } else {
    select.value = value;
  }

  select.dispatchEvent(new Event('change', { bubbles: true }));
}

export async function humanDelay(): Promise<void> {
  await sleep(randomBetween(HUMAN_DELAY_MIN_MS, HUMAN_DELAY_MAX_MS));
}
