import { useState } from 'preact/hooks';
import type { Macro } from '@shared/types/recording';

interface Props {
  macro: Macro;
  onBack: () => void;
  onExport: (macroId: string) => void;
  onDelete: (macroId: string) => void;
  onReplay: (macroId: string, params: Record<string, string>) => void;
}

export function MacroDetail({ macro, onBack, onExport, onDelete, onReplay }: Props) {
  const [params, setParams] = useState<Record<string, string>>(() => {
    const p: Record<string, string> = {};
    for (const param of macro.parameters) {
      p[param.name] = param.defaultValue;
    }
    return p;
  });

  const userActions = macro.timeline.filter((e) => e.type === 'USER_ACTION');
  const networkEvents = macro.timeline.filter(
    (e) => e.type === 'NETWORK_REQUEST' || e.type === 'NETWORK_RESPONSE',
  );
  const mutations = macro.timeline.filter((e) => e.type === 'DOM_MUTATION');
  const navigations = macro.timeline.filter((e) => e.type === 'NAVIGATION');

  return (
    <div>
      <div class="header">
        <button class="btn btn-outline" onClick={onBack} style={{ width: 'auto', padding: '4px 12px' }}>
          Back
        </button>
        <h1 style={{ flex: 1 }}>{macro.name}</h1>
      </div>
      <div class="content">
        <div style={{ marginBottom: '16px' }}>
          <div class="macro-meta">
            Created: {new Date(macro.createdAt).toLocaleString()}
          </div>
          <div class="macro-meta">Start URL: {macro.startUrl}</div>
          <div class="macro-meta" style={{ marginTop: '8px' }}>
            {userActions.length} actions &middot; {networkEvents.length} network &middot;{' '}
            {mutations.length} mutations &middot; {navigations.length} navigations
          </div>
        </div>

        {macro.parameters.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Parameters</h3>
            {macro.parameters.map((param) => (
              <div key={param.name} style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {param.name}
                  {param.description && ` — ${param.description}`}
                </label>
                <input
                  class="input"
                  type="text"
                  value={params[param.name] ?? ''}
                  onInput={(e) =>
                    setParams({ ...params, [param.name]: (e.target as HTMLInputElement).value })
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Timeline</h3>
          <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
            {macro.timeline.map((event, i) => (
              <div
                key={event.id}
                style={{
                  padding: '4px 8px',
                  borderLeft: '2px solid var(--border)',
                  marginBottom: '4px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  {i + 1}. {event.type}
                </span>
                {event.type === 'USER_ACTION' && (
                  <span> — {event.action}{event.text ? `: "${event.text}"` : ''}</span>
                )}
                {event.type === 'NAVIGATION' && (
                  <span> — {event.url}</span>
                )}
                {event.type === 'NETWORK_REQUEST' && (
                  <span> — {event.method} {new URL(event.url).pathname}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div class="btn-group">
          <button class="btn btn-primary" onClick={() => onReplay(macro.id, params)}>
            Replay
          </button>
          <button class="btn btn-outline" onClick={() => onExport(macro.id)}>
            Export
          </button>
          <button class="btn btn-danger" onClick={() => onDelete(macro.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
