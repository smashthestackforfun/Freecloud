import type { NetworkRequestEvent, NetworkResponseEvent } from '@shared/types/timeline';
import { generateId, now, truncateBody } from '@shared/utils';
import { MAX_RESPONSE_BODY_SIZE } from '@shared/constants';
import { getBlockedUrlPatterns, shouldCaptureRequest, shouldCaptureBody, shouldSkipStatus } from './network-filter';

interface PendingResponse {
  requestId: string;
  url: string;
  status: number;
  responseHeaders: Record<string, string>;
  mimeType?: string;
  timestamp: number;
}

type NetworkEventCallback = (event: NetworkRequestEvent | NetworkResponseEvent) => void;

export class CdpCapture {
  private tabId: number;
  private attached = false;
  private degraded = false;
  private pendingResponses = new Map<string, PendingResponse>();
  private onEvent: NetworkEventCallback;

  constructor(tabId: number, onEvent: NetworkEventCallback) {
    this.tabId = tabId;
    this.onEvent = onEvent;
  }

  async attach(): Promise<void> {
    const target = { tabId: this.tabId };
    await chrome.debugger.attach(target, '1.3');
    this.attached = true;

    await chrome.debugger.sendCommand(target, 'Network.enable');
    await chrome.debugger.sendCommand(target, 'Network.setBlockedURLs', {
      urls: getBlockedUrlPatterns(),
    });

    chrome.debugger.onEvent.addListener(this.handleCdpEvent);
    chrome.debugger.onDetach.addListener(this.handleDetach);
  }

  async detach(): Promise<void> {
    if (!this.attached) return;
    chrome.debugger.onEvent.removeListener(this.handleCdpEvent);
    chrome.debugger.onDetach.removeListener(this.handleDetach);
    try {
      await chrome.debugger.detach({ tabId: this.tabId });
    } catch {
      // already detached
    }
    this.attached = false;
    this.pendingResponses.clear();
  }

  isDegraded(): boolean {
    return this.degraded;
  }

  private handleDetach = (source: chrome.debugger.Debuggee, _reason?: string) => {
    if (source.tabId === this.tabId) {
      this.attached = false;
      this.degraded = true;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleCdpEvent = (source: chrome.debugger.Debuggee, method: string, params: any) => {
    if (source.tabId !== this.tabId) return;

    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleRequestWillBeSent(params);
        break;
      case 'Network.responseReceived':
        this.handleResponseReceived(params);
        break;
      case 'Network.loadingFinished':
        this.handleLoadingFinished(params);
        break;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleRequestWillBeSent(params: any): void {
    if (!shouldCaptureRequest(params.type)) return;

    const headers: Record<string, string> = {};
    if (params.request.headers) {
      for (const [key, value] of Object.entries(params.request.headers)) {
        headers[key] = String(value);
      }
    }

    const event: NetworkRequestEvent = {
      id: generateId(),
      timestamp: now(),
      type: 'NETWORK_REQUEST',
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method,
      requestHeaders: headers,
      requestBody: params.request.postData,
    };

    this.onEvent(event);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleResponseReceived(params: any): void {
    if (!shouldCaptureRequest(params.type)) return;
    if (shouldSkipStatus(params.response.status)) return;
    if (!shouldCaptureBody(params.response.mimeType)) return;

    const headers: Record<string, string> = {};
    if (params.response.headers) {
      for (const [key, value] of Object.entries(params.response.headers)) {
        headers[key] = String(value);
      }
    }

    this.pendingResponses.set(params.requestId, {
      requestId: params.requestId,
      url: params.response.url,
      status: params.response.status,
      responseHeaders: headers,
      mimeType: params.response.mimeType,
      timestamp: now(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleLoadingFinished(params: any): Promise<void> {
    const pending = this.pendingResponses.get(params.requestId);
    if (!pending) return;
    this.pendingResponses.delete(params.requestId);

    let responseBody: string | undefined;
    let truncated = false;

    try {
      const result = await chrome.debugger.sendCommand(
        { tabId: this.tabId },
        'Network.getResponseBody',
        { requestId: params.requestId },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (result as any)?.body;
      if (typeof body === 'string') {
        const truncResult = truncateBody(body, MAX_RESPONSE_BODY_SIZE);
        responseBody = truncResult.body;
        truncated = truncResult.truncated;
      }
    } catch {
      // body unavailable (e.g., streaming, opaque response)
    }

    const event: NetworkResponseEvent = {
      id: generateId(),
      timestamp: pending.timestamp,
      type: 'NETWORK_RESPONSE',
      requestId: pending.requestId,
      url: pending.url,
      status: pending.status,
      responseHeaders: pending.responseHeaders,
      responseBody,
      mimeType: pending.mimeType,
      truncated,
    };

    this.onEvent(event);
  }
}
