import { repeatLabel } from '../../lib/recurrence'
import { Checkbox } from '../ui/Checkbox'
import { Icon } from '../ui/Icon'
import { SwipeRow } from '../ui/SwipeRow'
import type { Category, Item } from '../../types/models'
import './ItemRow.css'

interface ItemRowProps {
  item: Item
  /** Colors the row and labels it, for lists that mix categories (the calendar). */
  category?: Category
  onToggle: () => void
  onDelete: () => void
  /** Tapping the row (not the checkbox) opens it for editing. */
  onOpen: () => void
}

/** A task (checkbox) or event (time pill) row; without a category, colors come from the surrounding tone. */
export function ItemRow({ item, category, onToggle, onDelete, onOpen }: ItemRowProps) {
  return (
    <SwipeRow label={item.title} onDelete={onDelete}>
      <div
        className={[
          'item-row',
          item.done && 'item-done',
          category && `item-row-labeled clay-tint tone-${category.color}`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onOpen}
      >
        {item.kind === 'task' ? (
          <Checkbox checked={item.done} label={item.title} onChange={onToggle} />
        ) : (
          <span className="item-time">{item.time ?? 'All day'}</span>
        )}
        <span className="item-text">
          <span className="item-title">{item.title}</span>
          {item.repeat && (
            <span className="item-repeat">
              <Icon name="repeat" size={12} strokeWidth={2.4} />
              {repeatLabel(item)}
            </span>
          )}
        </span>
        {category && (
          <span className="item-category">
            <span aria-hidden="true" />
            {category.name}
          </span>
        )}
      </div>
    </SwipeRow>
  )
}
