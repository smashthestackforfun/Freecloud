import { useState, useEffect } from 'preact/hooks';
import type { Macro } from '@shared/types/recording';
import type { RecorderState, ExtensionMessage } from '@shared/types/messages';
import { RecordControls } from './components/RecordControls';
import { MacroList } from './components/MacroList';
import { MacroDetail } from './components/MacroDetail';
import { StatusBar } from './components/StatusBar';

type Tab = 'record' | 'macros';

export function App() {
  const [tab, setTab] = useState<Tab>('record');
  const [state, setState] = useState<RecorderState>('idle');
  const [macros, setMacros] = useState<Macro[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const refreshStatus = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' }) as ExtensionMessage | undefined;
    if (response && response.type === 'STATUS' && 'payload' in response) {
      setState(response.payload.state);
    }
  };

  const refreshMacros = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_MACROS' }) as ExtensionMessage | undefined;
    if (response && response.type === 'MACROS_LIST' && 'payload' in response) {
      setMacros(response.payload.macros);
    }
  };

  useEffect(() => {
    refreshStatus();
    refreshMacros();
  }, []);

  const handleStartRecording = async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) return;

    await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      payload: { tabId: activeTab.id },
    });
    setState('recording');
    window.close();
  };

  const handleStopRecording = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }) as ExtensionMessage | undefined;
    if (response && response.type === 'RECORDING_STOPPED' && 'payload' in response) {
      setEventCount(response.payload.eventCount);
    }
    setState('idle');
  };

  const handleSaveMacro = async (name: string) => {
    await chrome.runtime.sendMessage({ type: 'SAVE_MACRO', payload: { name } });
    setEventCount(0);
    await refreshMacros();
    setTab('macros');
  };

  const handleExport = async (macroId: string) => {
    await chrome.runtime.sendMessage({ type: 'EXPORT_MACRO', payload: { macroId } });
  };

  const handleDelete = async (macroId: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_MACRO', payload: { macroId } });
    setSelectedMacro(null);
    await refreshMacros();
  };

  const handleReplay = async (macroId: string, params: Record<string, string>) => {
    await chrome.runtime.sendMessage({
      type: 'START_PLAYBACK',
      payload: { macroId, params },
    });
    window.close();
  };

  if (selectedMacro) {
    return (
      <div>
        <MacroDetail
          macro={selectedMacro}
          onBack={() => setSelectedMacro(null)}
          onExport={handleExport}
          onDelete={handleDelete}
          onReplay={handleReplay}
        />
      </div>
    );
  }

  return (
    <div>
      <div class="header">
        <h1>Freecloud</h1>
      </div>
      <div class="tabs">
        <button
          class={`tab ${tab === 'record' ? 'active' : ''}`}
          onClick={() => setTab('record')}
        >
          Record
        </button>
        <button
          class={`tab ${tab === 'macros' ? 'active' : ''}`}
          onClick={() => setTab('macros')}
        >
          Macros ({macros.length})
        </button>
      </div>
      <div class="content">
        {tab === 'record' ? (
          <RecordControls
            state={state}
            eventCount={eventCount}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onSave={handleSaveMacro}
          />
        ) : (
          <MacroList
            macros={macros}
            onSelect={setSelectedMacro}
            onExport={handleExport}
            onDelete={handleDelete}
          />
        )}
      </div>
      <StatusBar state={state} />
    </div>
  );
}
