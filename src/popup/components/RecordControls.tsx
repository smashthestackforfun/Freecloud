import { useState } from 'preact/hooks';
import type { RecorderState } from '@shared/types/messages';

interface Props {
  state: RecorderState;
  eventCount: number;
  onStart: () => void;
  onStop: () => void;
  onSave: (name: string) => void;
}

export function RecordControls({ state, eventCount, onStart, onStop, onSave }: Props) {
  const [macroName, setMacroName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const handleStop = () => {
    onStop();
    setShowSave(true);
  };

  const handleSave = () => {
    const name = macroName.trim() || `Macro ${new Date().toLocaleString()}`;
    onSave(name);
    setShowSave(false);
    setMacroName('');
  };

  if (state === 'recording') {
    return (
      <div>
        <div class="recording-indicator">
          <div class="recording-dot" />
          <span>Recording in progress...</span>
        </div>
        <button class="btn btn-danger" onClick={handleStop}>
          Stop Recording
        </button>
      </div>
    );
  }

  if (showSave && eventCount > 0) {
    return (
      <div>
        <p style={{ marginBottom: '8px' }}>
          Recorded {eventCount} events. Save this macro?
        </p>
        <input
          class="input"
          type="text"
          placeholder="Macro name"
          value={macroName}
          onInput={(e) => setMacroName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />
        <div class="btn-group">
          <button class="btn btn-primary" onClick={handleSave}>
            Save
          </button>
          <button class="btn btn-outline" onClick={() => setShowSave(false)}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
        Click the button below to start recording your actions on the current tab.
      </p>
      <button
        class="btn btn-primary"
        onClick={onStart}
        disabled={state === 'playing'}
      >
        Start Recording
      </button>
    </div>
  );
}
