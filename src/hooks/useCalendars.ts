import { useContext, useMemo } from 'react'

import { eventsOn } from '../lib/calendars'
import { CalendarsContext } from '../state/CalendarsProvider'
import type { CalendarFeed, ExternalEvent } from '../types/models'
import { useSettings } from './useSettings'

export function useCalendars() {
  const calendars = useContext(CalendarsContext)
  if (!calendars) throw new Error('useCalendars must be used inside <CalendarsProvider>')
  return calendars
}

/** Events from linked calendars on a date (multi-day ones included), with their calendar. */
export function useExternalDay(date: string) {
  const { events } = useCalendars()
  const feeds = useSettings().settings.calendars ?? []

  return useMemo(() => {
    const byId = new Map(feeds.map((f) => [f.id, f]))
    return eventsOn(events, date)
      .map((event) => ({ event, feed: byId.get(event.calendarId) }))
      .filter((e): e is { event: ExternalEvent; feed: CalendarFeed } => !!e.feed)
  }, [events, feeds, date])
}
