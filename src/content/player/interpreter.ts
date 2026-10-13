import type { UserActionEvent, TimelineEvent } from '@shared/types/timeline';
import { resolveSelector } from '../recorder/selector-generator';
import { simulateHumanClick, simulateHumanType, simulateSelect, humanDelay } from './human-simulator';
import { waitForCondition } from './wait-for';
import { checkForCaptcha } from './captcha-detector';
import { handleCaptcha } from './captcha-handler';
import { sendMessage } from '@shared/message-bus';
import { onMessage } from '@shared/message-bus';

export function initPlayer(): void {
  onMessage(async (message) => {
    if (message.type !== 'PLAYBACK_STEP') return;
    if (!('payload' in message)) return;

    const { step, params } = message.payload as {
      step: TimelineEvent;
      params: Record<string, string>;
    };

    if (step.type !== 'USER_ACTION') {
      sendMessage({
        type: 'PLAYBACK_STEP_COMPLETE',
        payload: { stepId: step.id, success: true },
      });
      return;
    }

    const result = await executeStep(step as UserActionEvent, params);
    sendMessage({
      type: 'PLAYBACK_STEP_COMPLETE',
      payload: { stepId: step.id, success: result.success, error: result.error },
    });
  });
}

interface StepResult {
  success: boolean;
  error?: string;
}

async function executeStep(
  step: UserActionEvent,
  params: Record<string, string>,
): Promise<StepResult> {
  if (checkForCaptcha()) {
    await handleCaptcha();
  }

  const element = resolveSelector(step.selectorChain);
  if (!element) {
    return { success: false, error: `Element not found for step ${step.id}` };
  }

  const htmlEl = element as HTMLElement;
  if (step.preConditions.visible && (htmlEl.offsetWidth === 0 || htmlEl.offsetHeight === 0)) {
    return { success: false, error: 'Element is not visible' };
  }
  if (step.preConditions.enabled && (htmlEl as HTMLInputElement).disabled) {
    return { success: false, error: 'Element is disabled' };
  }

  try {
    switch (step.action) {
      case 'click':
        await simulateHumanClick(element);
        break;

      case 'type': {
        let value = step.textValue ?? '';
        for (const [paramName, paramValue] of Object.entries(params)) {
          value = value.replaceAll(`{{${paramName}}}`, paramValue);
        }
        await simulateHumanType(element, value);
        break;
      }

      case 'select':
        await simulateSelect(element, step.textValue ?? '');
        break;

      case 'submit':
        if (element instanceof HTMLFormElement) {
          element.submit();
        }
        break;

      case 'keypress': {
        const keyEvent = new KeyboardEvent('keydown', {
          key: step.keyCode ?? 'Enter',
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(keyEvent);
        break;
      }
    }

    if (step.waitFor) {
      await waitForCondition(step.waitFor);
    }

    await humanDelay();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
