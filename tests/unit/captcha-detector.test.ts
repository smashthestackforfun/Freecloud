import { describe, it, expect, beforeEach } from 'vitest';
import { checkForCaptcha } from '../../src/content/player/captcha-detector';

describe('checkForCaptcha', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects reCAPTCHA iframes', () => {
    document.body.innerHTML = '<iframe src="https://www.google.com/recaptcha/api2/anchor"></iframe>';
    expect(checkForCaptcha()).toBe(true);
  });

  it('detects hCaptcha iframes', () => {
    document.body.innerHTML = '<iframe src="https://hcaptcha.com/challenge"></iframe>';
    expect(checkForCaptcha()).toBe(true);
  });

  it('detects .g-recaptcha class', () => {
    document.body.innerHTML = '<div class="g-recaptcha"></div>';
    expect(checkForCaptcha()).toBe(true);
  });

  it('detects .h-captcha class', () => {
    document.body.innerHTML = '<div class="h-captcha"></div>';
    expect(checkForCaptcha()).toBe(true);
  });

  it('detects data-captcha attribute', () => {
    document.body.innerHTML = '<div data-captcha="true"></div>';
    expect(checkForCaptcha()).toBe(true);
  });

  it('returns false when no captcha present', () => {
    document.body.innerHTML = '<div><form><input /><button>Submit</button></form></div>';
    expect(checkForCaptcha()).toBe(false);
  });

  it('returns false on empty body', () => {
    expect(checkForCaptcha()).toBe(false);
  });
});
