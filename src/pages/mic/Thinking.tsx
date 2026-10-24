import './Thinking.css'

export function Thinking() {
  return (
    <div className="mic-card thinking" role="status">
      <div className="thinking-header">
        <span className="thinking-dots" aria-hidden="true">
          <span className="tone-coral" />
          <span className="tone-blue" />
          <span className="tone-green" />
        </span>
        Sorting it out…
      </div>
      {['70%', '45%', '60%'].map((width) => (
        <div key={width} className="thinking-row" aria-hidden="true">
          <span />
          <span style={{ width }} />
        </div>
      ))}
    </div>
  )
}
