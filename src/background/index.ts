import type { RecorderState } from '@shared/types/messages';
import type { Macro } from '@shared/types/recording';
import { RECORDER_VERSION } from '@shared/types/recording';
import { KEEPALIVE_ALARM_NAME } from '@shared/constants';
import { onMessage, sendTabMessage } from '@shared/message-bus';
import { generateId } from '@shared/utils';
import { CdpCapture } from './cdp-capture';
import { TimelineAggregator } from './timeline-aggregator';
import { PlaybackOrchestrator } from './playback-orchestrator';
import {
  saveMacro,
  loadMacros,
  deleteMacro,
  getMacro,
  clearSessionData,
  restoreTimeline,
} from './storage-manager';
import { exportMacro } from './export';

let state: RecorderState = 'idle';
let recordingTabId: number | null = null;
let cdpCapture: CdpCapture | null = null;
let aggregator = new TimelineAggregator();
let startUrl = '';
let playbackOrchestrator: PlaybackOrchestrator | null = null;

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM_NAME) {
    // keepalive ping — no-op, just prevents service worker termination
  }
});

async function startRecording(tabId: number): Promise<void> {
  if (state !== 'idle') return;

  recordingTabId = tabId;
  aggregator = new TimelineAggregator();

  const restored = await restoreTimeline();
  if (restored.length > 0) {
    aggregator.restore(restored);
  }

  const tab = await chrome.tabs.get(tabId);
  startUrl = tab.url ?? '';

  cdpCapture = new CdpCapture(tabId, (event) => aggregator.addEvent(event));
  await cdpCapture.attach();

  chrome.alarms.create(KEEPALIVE_ALARM_NAME, { periodInMinutes: 0.4 });

  state = 'recording';
  sendTabMessage(tabId, { type: 'START_RECORDING' }).catch(() => {});
}

async function stopRecording(): Promise<void> {
  if (state !== 'recording') return;

  if (cdpCapture) {
    await cdpCapture.detach();
    cdpCapture = null;
  }

  chrome.alarms.clear(KEEPALIVE_ALARM_NAME);

  if (recordingTabId !== null) {
    sendTabMessage(recordingTabId, { type: 'STOP_RECORDING' }).catch(() => {});
  }

  state = 'idle';
  recordingTabId = null;
}

async function saveCurrentMacro(name: string): Promise<void> {
  const macro: Macro = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    recorderVersion: RECORDER_VERSION,
    startUrl,
    timeline: aggregator.getTimeline(),
    parameters: [],
  };

  await saveMacro(macro);
  aggregator.clear();
  await clearSessionData();
}

async function startPlayback(macroId: string, params: Record<string, string>): Promise<void> {
  const macro = await getMacro(macroId);
  if (!macro) return;

  state = 'playing';

  playbackOrchestrator = new PlaybackOrchestrator((step, total, playbackState) => {
    if (playbackState === 'complete' || playbackState === 'failed') {
      state = 'idle';
      playbackOrchestrator = null;
    }
  });

  await playbackOrchestrator.execute(macro, params);
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (state !== 'recording') return;
  if (details.tabId !== recordingTabId) return;
  if (details.frameId !== 0) return;

  aggregator.addEvent({
    id: generateId(),
    timestamp: Date.now(),
    type: 'NAVIGATION',
    url: details.url,
    transitionType: details.transitionType,
  });
});

onMessage(async (message, sender) => {
  switch (message.type) {
    case 'START_RECORDING': {
      if ('payload' in message && message.payload && 'tabId' in message.payload) {
        await startRecording(message.payload.tabId);
        return { type: 'RECORDING_STARTED' } as const;
      }
      break;
    }

    case 'STOP_RECORDING': {
      await stopRecording();
      return {
        type: 'RECORDING_STOPPED',
        payload: { eventCount: aggregator.getEventCount() },
      } as const;
      break;
    }

    case 'SAVE_MACRO': {
      if ('payload' in message && message.payload && 'name' in message.payload) {
        await saveCurrentMacro(message.payload.name);
      }
      break;
    }

    case 'GET_STATUS': {
      const macros = await loadMacros();
      return {
        type: 'STATUS',
        payload: { state, macroCount: macros.length },
      } as const;
    }

    case 'GET_MACROS': {
      const allMacros = await loadMacros();
      return { type: 'MACROS_LIST', payload: { macros: allMacros } } as const;
    }

    case 'DELETE_MACRO': {
      if ('payload' in message && message.payload && 'macroId' in message.payload) {
        await deleteMacro(message.payload.macroId);
      }
      break;
    }

    case 'EXPORT_MACRO': {
      if ('payload' in message && message.payload && 'macroId' in message.payload) {
        const macro = await getMacro(message.payload.macroId);
        if (macro) await exportMacro(macro);
      }
      break;
    }

    case 'START_PLAYBACK': {
      if ('payload' in message && message.payload && 'macroId' in message.payload) {
        const p = message.payload as { macroId: string; params: Record<string, string> };
        await startPlayback(p.macroId, p.params);
      }
      break;
    }

    case 'USER_ACTION':
    case 'DOM_MUTATION': {
      if (state === 'recording' && 'payload' in message) {
        const event = message.payload;
        if (sender.frameId !== undefined) {
          event.frameId = sender.frameId;
        }
        aggregator.addEvent(event);
      }
      break;
    }

    case 'CAPTCHA_DETECTED': {
      if (playbackOrchestrator) {
        await playbackOrchestrator.handleCaptchaDetected();
      }
      break;
    }

    case 'GET_RECORDING_STATE': {
      return {
        type: 'RECORDING_STATE',
        payload: { recording: state === 'recording' },
      } as const;
    }

    case 'PLAYBACK_STEP_COMPLETE': {
      // handled by orchestrator's waitForStepComplete
      break;
    }
  }
});
