import type { Macro } from '@shared/types/recording';
import type { TimelineEvent } from '@shared/types/timeline';
import { STORAGE_KEYS } from '@shared/constants';

export async function saveMacro(macro: Macro): Promise<void> {
  const macros = await loadMacros();
  macros.push(macro);
  await chrome.storage.local.set({ [STORAGE_KEYS.MACROS]: macros });
}

export async function loadMacros(): Promise<Macro[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MACROS);
  return result[STORAGE_KEYS.MACROS] ?? [];
}

export async function getMacro(id: string): Promise<Macro | undefined> {
  const macros = await loadMacros();
  return macros.find((m) => m.id === id);
}

export async function deleteMacro(id: string): Promise<void> {
  const macros = await loadMacros();
  const filtered = macros.filter((m) => m.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEYS.MACROS]: filtered });
}

export async function flushTimeline(timeline: TimelineEvent[]): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.SESSION_TIMELINE]: timeline });
}

export async function restoreTimeline(): Promise<TimelineEvent[]> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.SESSION_TIMELINE);
  return result[STORAGE_KEYS.SESSION_TIMELINE] ?? [];
}

export async function clearSessionData(): Promise<void> {
  await chrome.storage.session.remove([
    STORAGE_KEYS.SESSION_TIMELINE,
    STORAGE_KEYS.SESSION_STATE,
  ]);
}
