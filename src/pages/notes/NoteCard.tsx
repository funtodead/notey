import { Icon } from '../../components/ui/Icon'
import { SwipeRow } from '../../components/ui/SwipeRow'
import { useLongPress } from '../../hooks/useLongPress'
import { formatAgo } from '../../lib/dates'
import { findPhone } from '../../lib/notes'
import type { Category, Note } from '../../types/models'
import './NoteCard.css'

interface NoteCardProps {
  note: Note
  category: Category | undefined
  onOpen: () => void
  onMenu: () => void
  onDelete: () => void
}

/** A note: tap to edit, hold for actions, swipe to delete. A phone number in it is tap-to-call. */
export function NoteCard({ note, category, onOpen, onMenu, onDelete }: NoteCardProps) {
  const longPress = useLongPress(onMenu)
  const phone = findPhone(`${note.text} ${note.body ?? ''}`)

  return (
    <SwipeRow className="note-swipe" label={`note: ${note.text}`} onDelete={onDelete}>
      <article
        className={`note-card clay-tint tone-${category?.color ?? 'lavender'}`}
        onClick={onOpen}
        {...longPress}
      >
        <div className="note-card-meta">
          <span className="note-card-dot" aria-hidden="true" />
          <span className="note-card-category">{category?.name}</span>
          <span className="note-card-when">{formatAgo(note.createdAt)}</span>
        </div>
        <h2>{note.text}</h2>
        {note.body && <p>{note.body}</p>}
        {phone && (
          <div className="note-card-phone">
            <a
              className="clay-sm"
              href={`tel:${phone.tel}`}
              aria-label={`Call ${phone.display}. Press and hold for more`}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="phone" size={18} />
              {phone.display}
            </a>
            <span>
              Tap to call
              <br />
              Hold to copy
            </span>
          </div>
        )}
      </article>
    </SwipeRow>
  )
}
