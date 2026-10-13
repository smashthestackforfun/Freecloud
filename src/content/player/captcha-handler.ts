import { sendMessage } from '@shared/message-bus';
import { checkForCaptcha } from './captcha-detector';
import { sleep } from '@shared/utils';

export async function handleCaptcha(): Promise<void> {
  sendMessage({ type: 'CAPTCHA_DETECTED', payload: { url: window.location.href } });

  injectCaptchaBanner();

  while (checkForCaptcha()) {
    await sleep(500);
  }

  removeCaptchaBanner();
}

function injectCaptchaBanner(): void {
  if (document.getElementById('freecloud-captcha-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'freecloud-captcha-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    background: #dc2626; color: white;
    padding: 12px 20px; z-index: 2147483647;
    font-family: system-ui, sans-serif; font-size: 14px;
    text-align: center; font-weight: 600;
  `;
  banner.textContent = 'CAPTCHA detected — please solve it to continue macro playback';
  document.body.appendChild(banner);
}

function removeCaptchaBanner(): void {
  const banner = document.getElementById('freecloud-captcha-banner');
  if (banner) banner.remove();
}
