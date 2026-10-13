export class WindowManager {
  private windowId: number | null = null;
  private tabId: number | null = null;

  async openPlaybackWindow(url: string): Promise<{ windowId: number; tabId: number }> {
    const win = await chrome.windows.create({
      url,
      type: 'popup',
      state: 'minimized',
      focused: false,
      width: 1280,
      height: 800,
    });

    this.windowId = win?.id ?? null;
    this.tabId = win?.tabs?.[0]?.id ?? null;
    if (this.windowId === null || this.tabId === null) {
      throw new Error('Failed to create playback window');
    }
    return { windowId: this.windowId, tabId: this.tabId };
  }

  async maximizeWindow(): Promise<void> {
    if (this.windowId === null) return;
    await chrome.windows.update(this.windowId, { state: 'normal', focused: true });
  }

  async closeWindow(): Promise<void> {
    if (this.windowId === null) return;
    try {
      await chrome.windows.remove(this.windowId);
    } catch {
      // already closed
    }
    this.windowId = null;
    this.tabId = null;
  }

  getTabId(): number | null {
    return this.tabId;
  }

  getWindowId(): number | null {
    return this.windowId;
  }

  isActive(): boolean {
    return this.windowId !== null;
  }
}
