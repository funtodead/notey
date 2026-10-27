import './ProgressRing.css'

/** Today's tasks done; tapping it opens the stats. */
export function ProgressRing({ done, total, onClick }: { done: number; total: number; onClick: () => void }) {
  const pct = Math.round((done / total) * 100)

  return (
    <button
      className="progress-ring clay-sm"
      style={{ background: `conic-gradient(var(--accent) ${pct}%, var(--sunken) 0)` }}
      aria-label={`${done} of ${total} tasks done. Open stats`}
      onClick={onClick}
    >
      <span className="progress-ring-inner">
        {done}/{total}
      </span>
    </button>
  )
}
