import { Checkbox } from '../ui/Checkbox'
import { SwipeRow } from '../ui/SwipeRow'
import type { Item } from '../../types/models'
import './ItemRow.css'

interface ItemRowProps {
  item: Item
  onToggle: () => void
  onDelete: () => void
}

/** A task (checkbox) or event (time pill) row; colors come from the surrounding tone. */
export function ItemRow({ item, onToggle, onDelete }: ItemRowProps) {
  return (
    <SwipeRow label={item.title} onDelete={onDelete}>
      <div className={`item-row ${item.done ? 'item-done' : ''}`}>
        {item.kind === 'task' ? (
          <Checkbox checked={item.done} label={item.title} onChange={onToggle} />
        ) : (
          <span className="item-time">{item.time ?? 'All day'}</span>
        )}
        <span className="item-title">{item.title}</span>
      </div>
    </SwipeRow>
  )
}
