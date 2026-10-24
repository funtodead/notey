import { Icon } from '../../components/ui/Icon'
import { SwipeRow } from '../../components/ui/SwipeRow'
import type { List, ListItem } from '../../types/models'
import './ListTile.css'

const NEW_FOR_MS = 24 * 60 * 60 * 1000

interface ListTileProps {
  list: List
  items: ListItem[]
  onOpen: () => void
  onDelete: () => void
}

/** A list on the Lists page: emoji, name, counts and a progress bar. */
export function ListTile({ list, items, onOpen, onDelete }: ListTileProps) {
  const done = items.filter((i) => i.done).length
  const left = items.length - done
  const isNew = list.byNotey && Date.now() - new Date(list.createdAt).getTime() < NEW_FOR_MS
  const meta = `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${left} left`

  return (
    <SwipeRow className="list-tile-swipe" label={`list ${list.name}`} onDelete={onDelete}>
      <button
        className={`list-tile clay-tint tone-${list.color}`}
        aria-label={`${list.name}, ${meta}${isNew ? ', new, created by Notey' : ''}`}
        onClick={onOpen}
      >
        <span className="list-tile-emoji" aria-hidden="true">
          {list.emoji}
        </span>
        <span className="list-tile-text">
          <span className="list-tile-name">
            <span>{list.name}</span>
            {isNew && <span className="list-tile-new">New</span>}
          </span>
          <span className="list-tile-meta">{meta}</span>
        </span>
        <span className="list-tile-progress" aria-hidden="true">
          <span style={{ width: `${items.length ? Math.round((done / items.length) * 100) : 0}%` }} />
        </span>
        <Icon name="chevronRight" size={18} strokeWidth={2.4} />
      </button>
    </SwipeRow>
  )
}
