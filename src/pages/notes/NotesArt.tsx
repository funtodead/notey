import { Icon } from '../../components/ui/Icon'
import './NotesArt.css'

/** Empty-state illustration: two tilted clay cards and a couple of balls. */
export function NotesArt() {
  return (
    <div className="notes-art">
      <div className="notes-art-back tone-coral" />
      <div className="notes-art-front clay">
        <Icon name="notes" size={50} strokeWidth={2} />
      </div>
      <span className="art-ball tone-green" style={{ left: 172, top: 120, width: 34, height: 34 }} />
      <span className="art-ball tone-blue" style={{ left: 10, top: 10, width: 24, height: 24 }} />
    </div>
  )
}
