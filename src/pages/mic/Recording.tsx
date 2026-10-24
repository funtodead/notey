import './Recording.css'

export function Recording({ levels, seconds }: { levels: number[]; seconds: number }) {
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div className="recording clay" role="status" aria-label={`Recording, ${time}`}>
      <span className="recording-time">{time}</span>
      <div className="recording-bars" aria-hidden="true">
        {levels.map((level, i) => (
          <span key={i} style={{ height: `${6 + Math.round(level * 36)}px` }} />
        ))}
      </div>
    </div>
  )
}
