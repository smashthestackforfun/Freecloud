import type { Macro } from '@shared/types/recording';

interface Props {
  macros: Macro[];
  onSelect: (macro: Macro) => void;
  onExport: (macroId: string) => void;
  onDelete: (macroId: string) => void;
}

export function MacroList({ macros, onSelect, onExport, onDelete }: Props) {
  if (macros.length === 0) {
    return (
      <div class="empty-state">
        <p>No macros recorded yet.</p>
        <p style={{ marginTop: '4px' }}>
          Switch to the Record tab to create your first macro.
        </p>
      </div>
    );
  }

  return (
    <div>
      {macros.map((macro) => (
        <div key={macro.id} class="macro-item" onClick={() => onSelect(macro)}>
          <div>
            <div class="macro-name">{macro.name}</div>
            <div class="macro-meta">
              {macro.timeline.length} events &middot;{' '}
              {new Date(macro.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="macro-actions">
            <button
              class="btn btn-outline"
              onClick={(e) => {
                e.stopPropagation();
                onExport(macro.id);
              }}
            >
              Export
            </button>
            <button
              class="btn btn-outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(macro.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
