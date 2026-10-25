import { ExternalEventRow } from '../../components/items/ExternalEventRow'
import type { CalendarFeed, ExternalEvent } from '../../types/models'
import './CalendarSection.css'

/** Today's events from linked calendars (work, family, holidays), read-only. */
export function CalendarSection({ events }: { events: { event: ExternalEvent; feed: CalendarFeed }[] }) {
  return (
    <section className="calendar-section clay" aria-label="From your calendars">
      <h2>From your calendars</h2>
      {events.map(({ event, feed }) => (
        <ExternalEventRow key={event.id} event={event} feed={feed} />
      ))}
    </section>
  )
}
