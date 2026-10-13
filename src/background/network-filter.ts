import { BLOCKED_URL_PATTERNS, WANTED_RESOURCE_TYPES, BINARY_MIME_PREFIXES } from '@shared/constants';

export function getBlockedUrlPatterns(): string[] {
  return [...BLOCKED_URL_PATTERNS];
}

export function shouldCaptureRequest(resourceType: string): boolean {
  return (WANTED_RESOURCE_TYPES as readonly string[]).includes(resourceType);
}

export function shouldCaptureBody(mimeType: string | undefined): boolean {
  if (!mimeType) return true;
  return !BINARY_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export function shouldSkipStatus(status: number): boolean {
  return (status >= 300 && status < 400) || status === 204;
}
