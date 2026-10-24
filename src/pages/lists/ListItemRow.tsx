import { Checkbox } from '../../components/ui/Checkbox'
import { SwipeRow } from '../../components/ui/SwipeRow'
import type { ListItem } from '../../types/models'
import './ListItemRow.css'

const JUST_ADDED_MS = 30 * 60 * 1000

interface ListItemRowProps {
  item: ListItem
  onToggle: () => void
  onDelete: () => void
}

export function ListItemRow({ item, onToggle, onDelete }: ListItemRowProps) {
  const justAdded = !item.done && item.createdAt && Date.now() - new Date(item.createdAt).getTime() < JUST_ADDED_MS

  return (
    <SwipeRow className="list-item-swipe" label={item.text} onDelete={onDelete}>
      <div className={`list-item ${item.done ? 'list-item-done' : 'clay-sm'}`}>
        <Checkbox checked={item.done} label={item.text} onChange={onToggle} />
        <span className="list-item-text">{item.text}</span>
        {justAdded && <span className="list-item-new">Just added</span>}
        {item.qty && <span className="list-item-qty">{item.qty}</span>}
      </div>
    </SwipeRow>
  )
}
