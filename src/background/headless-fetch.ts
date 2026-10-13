import type { FastPathRecipe, DynamicToken } from '@shared/types/recording';

export interface FetchResult {
  success: boolean;
  data?: string;
  status?: number;
  reason?: 'CAPTCHA_TRIGGERED' | 'AUTH_FAILURE' | 'NETWORK_ERROR' | 'SERVER_ERROR';
}

async function resolveToken(token: DynamicToken): Promise<string | null> {
  switch (token.source) {
    case 'cookie': {
      const cookies = await chrome.cookies.getAll({ name: token.key });
      return cookies[0]?.value ?? null;
    }
    case 'localStorage':
    case 'sessionStorage':
      return null;
    case 'header':
      return null;
    default:
      return null;
  }
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  let result = template;
  for (const [name, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${name}}}`, value);
  }
  return result;
}

function applyParams(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [name, value] of Object.entries(params)) {
    result = result.replaceAll(`{{param:${name}}}`, value);
  }
  return result;
}

export async function executeFetchRecipe(
  recipe: FastPathRecipe,
  params: Record<string, string>,
): Promise<FetchResult> {
  const resolvedTokens: Record<string, string> = {};
  for (const token of recipe.dynamicTokens) {
    const value = await resolveToken(token);
    if (value === null) {
      return { success: false, reason: 'AUTH_FAILURE' };
    }
    resolvedTokens[token.name] = value;
  }

  const headers = { ...recipe.headers };
  for (const [key, value] of Object.entries(headers)) {
    headers[key] = applyTokens(value, resolvedTokens);
  }

  let body: string | undefined;
  if (recipe.bodyTemplate) {
    body = applyTokens(recipe.bodyTemplate, resolvedTokens);
    body = applyParams(body, params);
  }

  try {
    const response = await fetch(recipe.url, {
      method: recipe.method,
      headers,
      body,
      credentials: 'include',
    });

    if (response.status === 403 || response.status === 429) {
      return { success: false, status: response.status, reason: 'CAPTCHA_TRIGGERED' };
    }

    if (response.status >= 500) {
      return { success: false, status: response.status, reason: 'SERVER_ERROR' };
    }

    const data = await response.text();
    return { success: true, data, status: response.status };
  } catch {
    return { success: false, reason: 'NETWORK_ERROR' };
  }
}
