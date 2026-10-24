import './ListsArt.css'

/** Empty-state illustration: a clay card with three checklist rows. */
export function ListsArt() {
  return (
    <div className="lists-art">
      <div className="lists-art-card clay">
        {['green', 'coral', 'blue'].map((tone, i) => (
          <span key={tone} className="lists-art-row">
            <span className={`lists-art-dot tone-${tone}`} />
            <span className="lists-art-line" style={i === 2 ? { flex: 'none', width: 44 } : undefined} />
          </span>
        ))}
      </div>
      <span className="art-ball tone-amber" style={{ left: 160, top: 0, width: 46, height: 46 }} />
      <span className="art-ball tone-coral" style={{ left: 14, top: 116, width: 36, height: 36 }} />
    </div>
  )
}
