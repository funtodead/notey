import { useState } from 'react'

import { EditFiled } from '../../components/items/EditFiled'
import { ExternalEventRow } from '../../components/items/ExternalEventRow'
import { ItemRow } from '../../components/items/ItemRow'
import { Icon } from '../../components/ui/Icon'
import { useExternalDay } from '../../hooks/useCalendars'
import { useCategories } from '../../hooks/useCategories'
import { useDay } from '../../hooks/useDay'
import { useItemActions } from '../../hooks/useItemActions'
import { weekdayIndex } from '../../lib/calendar'
import { addDays, formatMediumDate } from '../../lib/dates'
import type { Item } from '../../types/models'
import './WeekView.css'

/** Seven days, Monday first, as one agenda; arrows step a week back or ahead. */
export function WeekView({ today }: { today: string }) {
  const thisWeek = addDays(today, -weekdayIndex(today))
  const [start, setStart] = useState(thisWeek)
  const [editing, setEditing] = useState<Item | null>(null)
  const actions = useItemActions()
  const end = addDays(start, 6)

  return (
    <>
      <div className="week-nav clay">
        <button aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}>
          <Icon name="back" size={20} strokeWidth={2.4} />
        </button>
        <button className="week-nav-label" onClick={() => setStart(thisWeek)}>
          {start === thisWeek ? 'This week' : `${formatMediumDate(start)} – ${formatMediumDate(end)}`}
        </button>
        <button aria-label="Next week" onClick={() => setStart(addDays(start, 7))}>
          <Icon name="chevronRight" size={20} strokeWidth={2.4} />
        </button>
      </div>

      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((date) => (
        <WeekDay key={date} date={date} today={today} onOpen={setEditing} />
      ))}

      <EditFiled
        entity={editing && { kind: 'item', id: editing.id }}
        onClose={() => setEditing(null)}
        onSave={(draft) => editing && actions.edit(editing, draft)}
        onRemove={() => editing && actions.removeAll(editing)}
      />
    </>
  )
}

function WeekDay({ date, today, onOpen }: { date: string; today: string; onOpen: (item: Item) => void }) {
  const { items, spans } = useDay(date)
  const external = useExternalDay(date)
  const { byId } = useCategories()
  const actions = useItemActions()
  const empty = items.length + spans.length + external.length === 0

  const row = (item: Item) => (
    <ItemRow
      key={item.id}
      item={item}
      category={byId.get(item.categoryId)}
      onToggle={() => actions.toggleDone(item)}
      onDelete={() => actions.remove(item)}
      onPostpone={() => actions.postpone(item)}
      onOpen={() => onOpen(item)}
    />
  )

  return (
    <section className={`week-day ${date < today ? 'week-day-past' : ''}`} aria-label={formatMediumDate(date)}>
      <h2 className={date === today ? 'week-day-today' : undefined}>
        {date === today ? 'Today' : formatMediumDate(date)}
      </h2>
      {spans.map(row)}
      {external.map(({ event, feed }) => (
        <ExternalEventRow key={event.id} event={event} feed={feed} />
      ))}
      {items.map(row)}
      {empty && <p className="week-day-empty">Nothing planned</p>}
    </section>
  )
}
