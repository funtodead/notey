import { Checkbox } from '../ui/Checkbox'
import { SwipeRow } from '../ui/SwipeRow'
import type { Category, Item } from '../../types/models'
import './ItemRow.css'

interface ItemRowProps {
  item: Item
  /** Colors the row and labels it, for lists that mix categories (the calendar). */
  category?: Category
  onToggle: () => void
  onDelete: () => void
}

/** A task (checkbox) or event (time pill) row; without a category, colors come from the surrounding tone. */
export function ItemRow({ item, category, onToggle, onDelete }: ItemRowProps) {
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
      >
        {item.kind === 'task' ? (
          <Checkbox checked={item.done} label={item.title} onChange={onToggle} />
        ) : (
          <span className="item-time">{item.time ?? 'All day'}</span>
        )}
        <span className="item-title">{item.title}</span>
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
