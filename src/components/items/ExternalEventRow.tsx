import type { CalendarFeed, ExternalEvent } from '../../types/models'
import './ExternalEventRow.css'

/** An event from a linked calendar: read-only, colored by its calendar. */
export function ExternalEventRow({ event, feed }: { event: ExternalEvent; feed: CalendarFeed }) {
  return (
    <div className={`external-event clay-tint tone-${feed.color}`}>
      <span className="external-event-time">
        {event.time ?? 'All day'}
        {event.endTime && <span>{event.endTime}</span>}
      </span>
      {/* dir="auto": Hebrew titles read right to left. */}
      <span className="external-event-title" dir="auto">
        {event.title}
      </span>
      <span className="external-event-calendar">
        <span aria-hidden="true" />
        {feed.name}
      </span>
    </div>
  )
}
