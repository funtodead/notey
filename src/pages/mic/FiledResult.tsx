import { Icon } from '../../components/ui/Icon'
import type { FiledSummary } from '../../lib/filing'
import type { EntityRef } from '../../types/models'
import { FiledRow, RemovedRow } from './FiledRow'
import './FiledResult.css'

const things = (n: number) => `${n} ${n === 1 ? 'thing' : 'things'}`

/** "Filed 2 things · Deleted 1", "Deleted 1 thing", … — also used for the header status. */
export function resultLabel(filed: number, deleted: number) {
  if (filed && deleted) return `Filed ${things(filed)} · Deleted ${deleted}`
  if (deleted) return `Deleted ${things(deleted)}`
  return filed ? `Filed ${things(filed)}` : 'Nothing to file'
}

interface FiledResultProps {
  refs: EntityRef[]
  removed: FiledSummary[]
  onEdit: (ref: EntityRef) => void
  onUndoAll: () => void
  onDone: () => void
}

/** "Filed 3 things" card: each filed thing can be fixed; Undo all also brings deleted things back. */
export function FiledResult({ refs, removed, onEdit, onUndoAll, onDone }: FiledResultProps) {
  const shown = refs.filter((r) => r.kind !== 'list')
  const anything = shown.length + removed.length > 0

  return (
    <div className="mic-card filed-result">
      <div className="filed-result-header">
        <span className="filed-result-check" aria-hidden="true">
          <Icon name="check" size={14} strokeWidth={3.2} />
        </span>
        <span className="filed-result-title">{resultLabel(shown.length, removed.length)}</span>
        {shown.length > 0 && <span className="filed-result-hint">Tap to fix</span>}
      </div>
      {shown.map((ref) => (
        <FiledRow key={ref.id} entity={ref} onClick={() => onEdit(ref)} />
      ))}
      {removed.map((summary, i) => (
        <RemovedRow key={i} summary={summary} />
      ))}
      <div className="filed-result-actions">
        {anything && (
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
