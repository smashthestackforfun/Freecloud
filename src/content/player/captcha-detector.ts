import { CAPTCHA_SELECTORS } from '@shared/constants';

export function checkForCaptcha(): boolean {
  for (const selector of CAPTCHA_SELECTORS) {
    if (document.querySelector(selector)) return true;
  }
  return false;
}

export class CaptchaWatcher {
  private observer: MutationObserver | null = null;
  private onDetected: () => void;
  private onResolved: () => void;
  private captchaPresent = false;

  constructor(onDetected: () => void, onResolved: () => void) {
    this.onDetected = onDetected;
    this.onResolved = onResolved;
  }

  start(): void {
    this.observer = new MutationObserver(() => {
      const hasCaptcha = checkForCaptcha();

      if (hasCaptcha && !this.captchaPresent) {
        this.captchaPresent = true;
        this.onDetected();
      } else if (!hasCaptcha && this.captchaPresent) {
        this.captchaPresent = false;
        this.onResolved();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
