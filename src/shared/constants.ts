export const BLOCKED_URL_PATTERNS = [
  '*google-analytics.com*',
  '*doubleclick.net*',
  '*googlesyndication.com*',
  '*googletagmanager.com*',
  '*facebook.com/tr*',
  '*connect.facebook.net*',
  '*mixpanel.com*',
  '*segment.com*',
  '*hotjar.com*',
  '*fullstory.com*',
  '*sentry.io*',
  '*newrelic.com*',
  '*datadoghq.com*',
  '*amplitude.com*',
  '*optimizely.com*',
  '*clarity.ms*',
  '*intercom.io*',
  '*crisp.chat*',
  '*zendesk.com/embeddable*',
];

export const WANTED_RESOURCE_TYPES = ['XHR', 'Fetch', 'Document'] as const;

export const BINARY_MIME_PREFIXES = [
  'image/',
  'font/',
  'video/',
  'audio/',
  'application/octet-stream',
  'application/pdf',
  'application/zip',
];

export const MAX_RESPONSE_BODY_SIZE = 1_048_576; // 1MB

export const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  'iframe[src*="arkoselabs"]',
  'iframe[src*="captcha"]',
  '.g-recaptcha',
  '.h-captcha',
  '#captcha-container',
  '[data-captcha]',
];

export const SENTINEL_SELECTORS = [
  '[data-testid*="post"]',
  '[data-testid*="result"]',
  '[data-testid*="item"]',
  '[role="article"]',
  '[role="listitem"]',
  'article',
  '.search-result',
  '.result-item',
];

export const MUTATION_DEBOUNCE_MS = 50;
export const MUTATION_TIMEOUT_MS = 3000;
export const CORRELATION_WINDOW_MS = 500;
export const KEEPALIVE_ALARM_NAME = 'freecloud-keepalive';
export const KEEPALIVE_INTERVAL_MS = 25_000;
export const FLUSH_INTERVAL_EVENTS = 10;
export const FLUSH_INTERVAL_MS = 5_000;
export const PLAYBACK_POLL_INTERVAL_MS = 100;

export const HUMAN_TYPE_MIN_MS = 50;
export const HUMAN_TYPE_MAX_MS = 150;
export const HUMAN_DELAY_MIN_MS = 1500;
export const HUMAN_DELAY_MAX_MS = 3000;

export const STORAGE_KEYS = {
  MACROS: 'freecloud_macros',
  SESSION_TIMELINE: 'freecloud_session_timeline',
  SESSION_STATE: 'freecloud_session_state',
} as const;
