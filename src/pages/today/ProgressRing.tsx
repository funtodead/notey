import './ProgressRing.css'

export function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = Math.round((done / total) * 100)

  return (
    <div
      className="progress-ring clay-sm"
      style={{ background: `conic-gradient(var(--accent) ${pct}%, var(--sunken) 0)` }}
      role="img"
      aria-label={`${done} of ${total} tasks done`}
    >
      <span className="progress-ring-inner">
        {done}/{total}
      </span>
    </div>
  )
}
