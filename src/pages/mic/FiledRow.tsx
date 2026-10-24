import { Icon } from '../../components/ui/Icon'
import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { describeRef, type FiledSummary } from '../../lib/filing'
import type { EntityRef } from '../../types/models'
import './FiledRow.css'

interface FiledRowProps {
  entity: EntityRef
  /** Single-line row used in the history; the full row shows a pencil to fix it. */
  compact?: boolean
  onClick: () => void
}

/** One filed thing and where it went, e.g. "Milk — Lists › Shopping". Tap to fix. */
export function FiledRow({ entity, compact, onClick }: FiledRowProps) {
  const { state } = useStore()
  const today = useTodayDate()
  const summary = describeRef(entity, state, today)
  if (!summary) return null

  return (
    <button
      className={`filed-row tone-${summary.color} ${compact ? 'filed-row-compact' : ''}`}
      aria-label={`Edit ${summary.title}, filed to ${summary.where}`}
      onClick={onClick}
    >
      <span className="filed-row-icon" aria-hidden="true">
        <Icon name={summary.icon} size={compact ? 16 : 20} strokeWidth={compact ? 2.4 : 2.2} />
      </span>
      {compact ? (
        <>
          <span className="filed-row-title">{summary.title}</span>
          <span className="filed-row-where">{summary.where}</span>
        </>
      ) : (
        <>
          <span className="filed-row-text">
            <span className="filed-row-title">{summary.title}</span>
            <span className="filed-row-where">{summary.where}</span>
          </span>
          <Icon name="pencil" size={18} />
        </>
      )}
    </button>
  )
}

/** Something the AI deleted: shown crossed out, with nothing to fix (Undo all brings it back). */
export function RemovedRow({ summary, compact }: { summary: FiledSummary; compact?: boolean }) {
  return (
    <div className={`filed-row filed-row-removed tone-${summary.color} ${compact ? 'filed-row-compact' : ''}`}>
      <span className="filed-row-icon" aria-hidden="true">
        <Icon name="trash" size={compact ? 16 : 20} />
      </span>
      <span className="filed-row-text">
        <span className="filed-row-title">
          <span className="visually-hidden">Deleted: </span>
          {summary.title}
        </span>
        {!compact && <span className="filed-row-where">{summary.where}</span>}
      </span>
    </div>
  )
}
