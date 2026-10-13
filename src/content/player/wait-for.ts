import type { WaitForCondition } from '@shared/types/timeline';
import { resolveSelector } from '../recorder/selector-generator';
import { PLAYBACK_POLL_INTERVAL_MS } from '@shared/constants';
import { sleep } from '@shared/utils';

export async function waitForCondition(condition: WaitForCondition): Promise<boolean> {
  const deadline = Date.now() + condition.timeout;

  while (Date.now() < deadline) {
    const satisfied = checkCondition(condition);
    if (satisfied) return true;
    await sleep(PLAYBACK_POLL_INTERVAL_MS);
  }

  return false;
}

function checkCondition(condition: WaitForCondition): boolean {
  const element = resolveSelector(condition.selectorChain);

  switch (condition.type) {
    case 'element_attached':
      return element !== null;
    case 'element_removed':
      return element === null;
    case 'text_content':
      if (!element || !condition.expectedText) return false;
      return (element.textContent ?? '').includes(condition.expectedText);
    default:
      return false;
  }
}
