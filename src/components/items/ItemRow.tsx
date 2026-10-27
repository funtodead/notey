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
  /** Swipe right to move it a day later; left out for repeating items. */
  onPostpone?: () => void
  /** Tapping the row (not the checkbox) opens it for editing. */
  onOpen: () => void
}

/** A task (checkbox) or event (time pill) row; without a category, colors come from the surrounding tone. */
export function ItemRow({ item, category, onToggle, onDelete, onPostpone, onOpen }: ItemRowProps) {
  return (
    <SwipeRow label={item.title} onDelete={onDelete} onPostpone={item.repeat ? undefined : onPostpone}>
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
          <span className="item-title">
            {item.starred && (
              <span className="item-star" aria-label="Important">
                <Icon name="star" size={13} strokeWidth={2} />
              </span>
            )}
            {item.title}
          </span>
          {/* A task's time (the checkbox takes the time pill's place), reminder bell and repeat rule. */}
          {((item.kind === 'task' && item.time) || item.remind || item.repeat) && (
            <span className="item-repeat">
              {item.remind && <Icon name="bell" size={12} strokeWidth={2.4} />}
              {item.kind === 'task' && item.time}
              {item.repeat && (
                <>
                  <Icon name="repeat" size={12} strokeWidth={2.4} />
                  {repeatLabel(item)}
                </>
              )}
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
