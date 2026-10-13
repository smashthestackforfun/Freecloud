import type {
  UserActionEvent,
  DomMutationEvent,
  TimelineEvent,
} from './timeline';
import type { Macro } from './recording';

export type ContentToBackground =
  | { type: 'USER_ACTION'; payload: UserActionEvent }
  | { type: 'DOM_MUTATION'; payload: DomMutationEvent }
  | { type: 'CAPTCHA_DETECTED'; payload: { url: string } }
  | { type: 'GET_RECORDING_STATE' }
  | { type: 'PLAYBACK_STEP_COMPLETE'; payload: { stepId: string; success: boolean; error?: string } };

export type BackgroundToContent =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDING_STATE'; payload: { recording: boolean } }
  | { type: 'PLAYBACK_STEP'; payload: { step: TimelineEvent; params: Record<string, string> } }
  | { type: 'PLAYBACK_COMPLETE' };

export type PopupToBackground =
  | { type: 'START_RECORDING'; payload: { tabId: number } }
  | { type: 'STOP_RECORDING' }
  | { type: 'GET_STATUS' }
  | { type: 'START_PLAYBACK'; payload: { macroId: string; params: Record<string, string> } }
  | { type: 'EXPORT_MACRO'; payload: { macroId: string } }
  | { type: 'DELETE_MACRO'; payload: { macroId: string } }
  | { type: 'GET_MACROS' }
  | { type: 'SAVE_MACRO'; payload: { name: string } };

export type BackgroundToPopup =
  | { type: 'STATUS'; payload: { state: RecorderState; macroCount: number } }
  | { type: 'MACROS_LIST'; payload: { macros: Macro[] } }
  | { type: 'RECORDING_STARTED' }
  | { type: 'RECORDING_STOPPED'; payload: { eventCount: number } }
  | { type: 'PLAYBACK_STATUS'; payload: { step: number; total: number; state: PlaybackState } }
  | { type: 'ERROR'; payload: { message: string } };

export type RecorderState = 'idle' | 'recording' | 'playing';
export type PlaybackState = 'running' | 'paused_captcha' | 'complete' | 'failed';

export type ExtensionMessage =
  | ContentToBackground
  | BackgroundToContent
  | PopupToBackground
  | BackgroundToPopup;
