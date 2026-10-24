import { useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { useCategories } from '../../hooks/useCategories'
import { useItemActions } from '../../hooks/useItemActions'
import { formatPastDay } from '../../lib/dates'
import type { Item } from '../../types/models'
import './OverdueSection.css'

export function OverdueSection({ items, today }: { items: Item[]; today: string }) {
  const [open, setOpen] = useState(true)
  const { byId } = useCategories()
  const { moveTo } = useItemActions()

  return (
    <section className="overdue clay-sm" aria-label="Overdue">
      <div className="overdue-header">
        <button className="overdue-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="overdue-mark" aria-hidden="true" />
          Overdue
          <span className="overdue-count">{items.length}</span>
          <span className={`overdue-chevron ${open ? 'overdue-chevron-open' : ''}`}>
            <Icon name="chevronDown" size={18} strokeWidth={2.4} />
          </span>
        </button>
        <button className="overdue-move-all" onClick={() => items.forEach((item) => moveTo(item, today))}>
          Move all to today
        </button>
      </div>

      {open &&
        items.map((item) => (
          <div key={item.id} className={`overdue-row tone-${byId.get(item.categoryId)?.color}`}>
            <span className="overdue-dot" aria-hidden="true" />
            <span className="overdue-title">{item.title}</span>
            <span className="overdue-due">{formatPastDay(item.date, today)}</span>
            <button
              className="overdue-move clay-sm"
              aria-label={`Move to today: ${item.title}`}
              onClick={() => moveTo(item, today)}
            >
              <Icon name="arrowRight" size={14} strokeWidth={2.6} />
              Today
            </button>
          </div>
        ))}
    </section>
  )
}
