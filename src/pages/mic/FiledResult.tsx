import { Icon } from '../../components/ui/Icon'
import type { EntityRef } from '../../types/models'
import { FiledRow } from './FiledRow'
import './FiledResult.css'

interface FiledResultProps {
  refs: EntityRef[]
  onEdit: (ref: EntityRef) => void
  onUndoAll: () => void
  onDone: () => void
}

/** "Filed 3 things" card: each thing can be fixed, or everything undone. */
export function FiledResult({ refs, onEdit, onUndoAll, onDone }: FiledResultProps) {
  const shown = refs.filter((r) => r.kind !== 'list')

  return (
    <div className="mic-card filed-result">
      <div className="filed-result-header">
        <span className="filed-result-check" aria-hidden="true">
          <Icon name="check" size={14} strokeWidth={3.2} />
        </span>
        <span className="filed-result-title">
          {shown.length === 0
            ? 'Nothing to file'
            : `Filed ${shown.length} ${shown.length === 1 ? 'thing' : 'things'}`}
        </span>
        {shown.length > 0 && <span className="filed-result-hint">Tap to fix</span>}
      </div>
      {shown.map((ref) => (
        <FiledRow key={ref.id} entity={ref} onClick={() => onEdit(ref)} />
      ))}
      <div className="filed-result-actions">
        {shown.length > 0 && (
          <button className="filed-result-undo" onClick={onUndoAll}>
            <Icon name="undo" size={16} strokeWidth={2.4} />
            Undo all
          </button>
        )}
        <button className="mic-pill-button mic-pill-primary filed-result-done" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
