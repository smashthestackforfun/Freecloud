import type { DynamicToken } from '@shared/types/recording';

export async function extractTokenFromCookie(name: string, domain?: string): Promise<string | null> {
  const cookies = await chrome.cookies.getAll(domain ? { name, domain } : { name });
  return cookies[0]?.value ?? null;
}

export function detectDynamicTokens(
  headers: Record<string, string>,
): DynamicToken[] {
  const tokens: DynamicToken[] = [];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'x-csrf-token' || lowerKey === 'x-xsrf-token' || lowerKey === 'csrf-token') {
      tokens.push({ name: `csrf_${key}`, source: 'cookie', key: value });
    }
    if (lowerKey === 'authorization' && value.startsWith('Bearer ')) {
      tokens.push({ name: 'bearer_token', source: 'cookie', key: 'auth_token' });
    }
  }

  return tokens;
}
