import type { Macro } from '@shared/types/recording';
import type { TimelineEvent, UserActionEvent } from '@shared/types/timeline';
import type { PlaybackState } from '@shared/types/messages';
import { sendTabMessage } from '@shared/message-bus';
import { executeFetchRecipe } from './headless-fetch';
import { WindowManager } from './window-manager';

type StatusCallback = (step: number, total: number, state: PlaybackState) => void;

export class PlaybackOrchestrator {
  private windowManager = new WindowManager();
  private currentStep = 0;
  private steps: UserActionEvent[] = [];
  private playing = false;
  private onStatus: StatusCallback;

  constructor(onStatus: StatusCallback) {
    this.onStatus = onStatus;
  }

  async execute(macro: Macro, params: Record<string, string>): Promise<void> {
    this.steps = macro.timeline.filter(
      (e): e is UserActionEvent => e.type === 'USER_ACTION',
    );
    this.currentStep = 0;
    this.playing = true;

    if (macro.fastPathRecipe) {
      const result = await executeFetchRecipe(macro.fastPathRecipe, params);
      if (result.success) {
        this.onStatus(this.steps.length, this.steps.length, 'complete');
        return;
      }
    }

    await this.runUiPlayback(macro.startUrl, params);
  }

  private async runUiPlayback(startUrl: string, params: Record<string, string>): Promise<void> {
    const { tabId } = await this.windowManager.openPlaybackWindow(startUrl);

    await new Promise<void>((resolve) => {
      const listener = (
        _tabId: number,
        changeInfo: { status?: string },
      ) => {
        if (_tabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    await this.injectPlayerScript(tabId);

    for (let i = 0; i < this.steps.length; i++) {
      if (!this.playing) break;

      this.currentStep = i;
      this.onStatus(i, this.steps.length, 'running');

      const step: TimelineEvent = { ...this.steps[i] };
      await sendTabMessage(tabId, {
        type: 'PLAYBACK_STEP',
        payload: { step, params },
      });

      await this.waitForStepComplete(tabId);
    }

    await this.windowManager.closeWindow();
    this.onStatus(this.steps.length, this.steps.length, 'complete');
  }

  private async injectPlayerScript(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/player/interpreter.ts'],
    });
  }

  private waitForStepComplete(_tabId: number): Promise<void> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = (message: any) => {
        if (message?.type === 'PLAYBACK_STEP_COMPLETE') {
          chrome.runtime.onMessage.removeListener(listener);
          resolve();
          return undefined;
        }
        return undefined;
      };
      chrome.runtime.onMessage.addListener(listener);
    });
  }

  async handleCaptchaDetected(): Promise<void> {
    this.onStatus(this.currentStep, this.steps.length, 'paused_captcha');
    await this.windowManager.maximizeWindow();
  }

  async handleCaptchaResolved(): Promise<void> {
    this.onStatus(this.currentStep, this.steps.length, 'running');
  }

  stop(): void {
    this.playing = false;
    this.windowManager.closeWindow();
  }

  isPlaying(): boolean {
    return this.playing;
  }
}
