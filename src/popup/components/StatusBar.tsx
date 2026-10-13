import type { RecorderState } from '@shared/types/messages';

interface Props {
  state: RecorderState;
}

export function StatusBar({ state }: Props) {
  const labels: Record<RecorderState, string> = {
    idle: 'Ready',
    recording: 'Recording...',
    playing: 'Playing macro...',
  };

  return (
    <div class="status-bar">
      {labels[state]}
    </div>
  );
}
