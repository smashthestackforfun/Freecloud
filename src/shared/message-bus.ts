import type { ExtensionMessage } from './types/messages';

type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
) => Promise<ExtensionMessage | void> | void;

export function sendMessage(message: ExtensionMessage): Promise<ExtensionMessage | undefined> {
  return chrome.runtime.sendMessage(message);
}

export function sendTabMessage(
  tabId: number,
  message: ExtensionMessage,
): Promise<ExtensionMessage | undefined> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function onMessage(handler: MessageHandler): void {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: ExtensionMessage) => void,
    ) => {
      const result = handler(message, sender);
      if (result instanceof Promise) {
        result.then((response) => {
          if (response) sendResponse(response);
        });
        return true;
      }
    },
  );
}
