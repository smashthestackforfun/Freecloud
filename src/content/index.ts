import { EventListenerManager } from './recorder/event-listeners';
import { DomMutationTracker } from './recorder/mutation-observer';
import { NavigationHandler } from './recorder/navigation-handler';
import { initPlayer } from './player/interpreter';
import { sendMessage, onMessage } from '@shared/message-bus';

let eventListeners: EventListenerManager | null = null;
let mutationTracker: DomMutationTracker | null = null;
let navigationHandler: NavigationHandler | null = null;
let isRecording = false;

function startRecording(): void {
  if (isRecording) return;
  isRecording = true;

  mutationTracker = new DomMutationTracker();
  mutationTracker.start();

  eventListeners = new EventListenerManager(() => mutationTracker?.arm());
  eventListeners.start();

  navigationHandler = new NavigationHandler();
  navigationHandler.start();
}

function stopRecording(): void {
  if (!isRecording) return;
  isRecording = false;

  eventListeners?.stop();
  eventListeners = null;

  mutationTracker?.stop();
  mutationTracker = null;

  navigationHandler?.stop();
  navigationHandler = null;
}

onMessage(async (message) => {
  switch (message.type) {
    case 'START_RECORDING':
      startRecording();
      break;
    case 'STOP_RECORDING':
      stopRecording();
      break;
    case 'RECORDING_STATE':
      if ('payload' in message && message.payload && 'recording' in message.payload) {
        if (message.payload.recording) startRecording();
      }
      break;
  }
});

initPlayer();

sendMessage({ type: 'GET_RECORDING_STATE' });
