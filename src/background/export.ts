import type { Macro } from '@shared/types/recording';

export async function exportMacro(macro: Macro): Promise<void> {
  const json = JSON.stringify(macro, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = macro.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `macro-${safeName}-${timestamp}.json`;

  await chrome.downloads.download({
    url,
    filename,
    saveAs: true,
  });
}
