import { Icon } from '../../components/ui/Icon'
import type { FiledSummary } from '../../lib/filing'
import type { EntityRef } from '../../types/models'
import { FiledRow, RemovedRow } from './FiledRow'
import './FiledResult.css'

const things = (n: number) => `${n} ${n === 1 ? 'thing' : 'things'}`

/** "Filed 2 things · Changed 1 · Deleted 1", "Changed 1 thing", … — also used for the header status. */
export function resultLabel(filed: number, changed: number, deleted: number) {
  const parts = [filed && `Filed ${filed}`, changed && `Changed ${changed}`, deleted && `Deleted ${deleted}`].filter(
    (p): p is string => !!p,
  )
  if (parts.length === 0) return 'Nothing to file'
  // A single part reads better with its noun: "Filed 2 things".
  if (parts.length === 1) return `${parts[0].split(' ')[0]} ${things(filed || changed || deleted)}`
  return parts.join(' · ')
}

interface FiledResultProps {
  refs: EntityRef[]
  changed: EntityRef[]
  removed: FiledSummary[]
  onEdit: (ref: EntityRef) => void
  onUndoAll: () => void
  onDone: () => void
}

/** Result card: filed and changed things can be fixed; Undo all also brings deleted things back. */
export function FiledResult({ refs, changed, removed, onEdit, onUndoAll, onDone }: FiledResultProps) {
  const shown = refs.filter((r) => r.kind !== 'list')
  const anything = shown.length + changed.length + removed.length > 0

  return (
    <div className="mic-card filed-result">
      <div className="filed-result-header">
        <span className="filed-result-check" aria-hidden="true">
          <Icon name="check" size={14} strokeWidth={3.2} />
        </span>
        <span className="filed-result-title">{resultLabel(shown.length, changed.length, removed.length)}</span>
        {shown.length + changed.length > 0 && <span className="filed-result-hint">Tap to fix</span>}
      </div>
      {shown.map((ref) => (
        <FiledRow key={ref.id} entity={ref} onClick={() => onEdit(ref)} />
      ))}
      {changed.map((ref) => (
        <FiledRow
          key={ref.id}
          entity={ref}
          badge="Changed"
          // A renamed list has nothing to fix in the item sheet.
          onClick={ref.kind === 'list' ? undefined : () => onEdit(ref)}
        />
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
