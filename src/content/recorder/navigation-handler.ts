import { sendMessage } from '@shared/message-bus';

export class NavigationHandler {
  private beforeUnloadHandler: (() => void) | null = null;

  start(): void {
    this.beforeUnloadHandler = () => {
      sendMessage({ type: 'GET_RECORDING_STATE' });
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  stop(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
}
