import { createGesture } from '@ionic/react'
import { useEffect, useRef, useState } from 'react'

import { EditFiled } from '../../components/items/EditFiled'
import { ExternalEventRow } from '../../components/items/ExternalEventRow'
import { useExternalDay } from '../../hooks/useCalendars'
import { ItemRow } from '../../components/items/ItemRow'
import { Icon } from '../../components/ui/Icon'
import { useCategories } from '../../hooks/useCategories'
import { useDay } from '../../hooks/useDay'
import { useItemActions } from '../../hooks/useItemActions'
import { daysBetween, formatLongDate } from '../../lib/dates'
import type { Item } from '../../types/models'
import './DaySheet.css'

interface DaySheetProps {
  date: string
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

/**
 * The selected day's agenda, docked under the calendar. Tap or drag the handle up to see
 * a busy day in full; down (or ✕) to dock it again.
 */
export function DaySheet({ date, expanded, onExpandedChange }: DaySheetProps) {
  const { items, spans } = useDay(date)
  const { byId } = useCategories()
  const actions = useItemActions()
  const [editing, setEditing] = useState<Item | null>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const gesture = createGesture({
      el: handleRef.current!,
      gestureName: 'day-sheet',
      direction: 'y',
      threshold: 10,
      onEnd: ({ deltaY }) => {
        if (deltaY < -40) onExpandedChange(true)
        if (deltaY > 40) onExpandedChange(false)
      },
    })
    gesture.enable()
    return () => gesture.destroy()
  }, [onExpandedChange])

  const events = items.filter((i) => i.kind === 'event')
  const tasks = items.filter((i) => i.kind === 'task')
  const external = useExternalDay(date)
  const total = items.length + spans.length + external.length

  const row = (item: Item) => (
    <ItemRow
      key={item.id}
      item={item}
      category={byId.get(item.categoryId)}
      onToggle={() => actions.toggleDone(item)}
      onDelete={() => actions.remove(item)}
      onOpen={() => setEditing(item)}
    />
  )

  return (
    <>
      {expanded && <button className="day-sheet-scrim" aria-label="Close day" onClick={() => onExpandedChange(false)} />}
      <section className={`day-sheet ${expanded ? 'day-sheet-expanded' : ''}`} aria-label={formatLongDate(date)}>
        <div ref={handleRef} className="day-sheet-handle">
          <button
            className="day-sheet-grabber"
            aria-label={expanded ? 'Show less' : 'Show the whole day'}
            onClick={() => onExpandedChange(!expanded)}
          />
          <div className="day-sheet-header">
            <div>
              <h2>{formatLongDate(date)}</h2>
              <span>{total === 1 ? '1 item' : `${total} items`}</span>
            </div>
            {expanded && (
              <button className="day-sheet-close" aria-label="Close day" onClick={() => onExpandedChange(false)}>
                <Icon name="close" size={20} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </div>

        <div className="day-sheet-body">
          {spans.map((span) => (
            <div key={span.id} className={`day-sheet-span clay-tint tone-${byId.get(span.categoryId)?.color}`}>
              <span className="day-sheet-span-when">All day</span>
              <span className="day-sheet-span-title">{span.title}</span>
              <span className="day-sheet-span-progress">
                day {daysBetween(span.date, date) + 1} of {daysBetween(span.date, span.endDate) + 1}
              </span>
            </div>
          ))}
          {external.length > 0 && <h3>From your calendars</h3>}
          {external.map(({ event, feed }) => (
            <ExternalEventRow key={event.id} event={event} feed={feed} />
          ))}
          {events.length > 0 && <h3>Schedule</h3>}
          {events.map(row)}
          {tasks.length > 0 && <h3>To do</h3>}
          {tasks.map(row)}
          {total === 0 && <p className="day-sheet-empty">Nothing planned. Tap the mic to add something.</p>}
        </div>
      </section>
      <EditFiled
        entity={editing && { kind: 'item', id: editing.id }}
        onClose={() => setEditing(null)}
        onSave={(draft) => editing && actions.edit(editing, draft)}
        onRemove={() => editing && actions.removeAll(editing)}
      />
    </>
  )
}
