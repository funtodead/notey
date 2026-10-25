import ICAL from 'ical.js'

import type { CalendarFeed, ExternalEvent } from '../types/models'
import { addDays, toISODate } from './dates'
import { PUSH_API } from './push'

const HOLIDAYS_URL =
  'https://www.hebcal.com/hebcal?v=1&cfg=ics&maj=on&min=on&mod=on&nx=off&mf=off&ss=off&c=off&s=off&i=on&lg=he&year=now&month=x&ny=2'

/** Hosts the Worker will fetch from (it refuses others); checked here too to explain a bad link early. */
const LINK_HOSTS = [/\.icloud\.com$/, /^calendar\.google\.com$/, /^outlook\.(office365|office|live)\.com$/]

/** Events from 30 days back to the end of next year, matching what the calendar shows. */
function window(now: Date) {
  return { from: addDays(toISODate(now), -30), to: `${now.getFullYear() + 1}-12-31` }
}

export function isSupportedLink(link: string) {
  try {
    const url = new URL(link.trim().replace(/^webcal:/, 'https:'))
    return url.protocol === 'https:' && LINK_HOSTS.some((host) => host.test(url.hostname))
  } catch {
    return false
  }
}

/** Events on a date (multi-day ones included): all-day first, then by time. */
export function eventsOn(events: ExternalEvent[], date: string) {
  return events
    .filter((e) => e.date === date || (e.endDate && e.date <= date && date <= e.endDate))
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
}

/** The address the iPhone Shortcut posts its events to. */
export const bridgeUrl = (bridgeId: string) => `${PUSH_API}/bridge/${bridgeId}`

const hhmm = (date: Date) => date.toTimeString().slice(0, 5)

/** A start/end pair in local time; all-day ends are exclusive (the next midnight), as in calendars. */
function toEvent(
  calendarId: string,
  id: string,
  title: string,
  start: Date,
  rawEnd: Date,
  allDay: boolean,
): ExternalEvent {
  // An unreadable or backwards end would make the event endless; treat it as ending when it starts.
  const end = Number.isNaN(rawEnd.getTime()) || rawEnd < start ? start : rawEnd
  const date = toISODate(start)
  const lastDay = toISODate(new Date(end.getTime() - (allDay ? 1 : 0)))
  const event: ExternalEvent = { id, calendarId, title: title || 'Busy', date }
  if (lastDay > date) event.endDate = lastDay
  if (!allDay) {
    event.time = hhmm(start)
    event.endTime = hhmm(end)
  }
  return event
}

/** Reads an .ics calendar, expanding repeating events within the window. */
export function parseIcs(text: string, calendarId: string, now = new Date()): ExternalEvent[] {
  const { from, to } = window(now)
  const root = new ICAL.Component(ICAL.parse(text))
  for (const zone of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(zone)

  // Edited single occurrences of a repeating event come as extra VEVENTs with the same UID.
  const masters = new Map<string, ICAL.Event>()
  const exceptions: ICAL.Component[] = []
  for (const component of root.getAllSubcomponents('vevent')) {
    if (component.hasProperty('recurrence-id')) exceptions.push(component)
    else {
      const event = new ICAL.Event(component)
      masters.set(event.uid, event)
    }
  }
  for (const exception of exceptions) {
    const master = masters.get(exception.getFirstPropertyValue('uid') as string)
    if (master) master.relateException(exception)
  }

  const events: ExternalEvent[] = []
  for (const event of masters.values()) {
    if (!event.isRecurring()) {
      const e = toEvent(calendarId, event.uid, event.summary, event.startDate.toJSDate(), event.endDate.toJSDate(), event.startDate.isDate)
      if ((e.endDate ?? e.date) >= from && e.date <= to) events.push(e)
      continue
    }
    const iterator = event.iterator()
    for (let next = iterator.next(), n = 0; next && n < 1000; next = iterator.next(), n++) {
      const details = event.getOccurrenceDetails(next)
      const start = details.startDate.toJSDate()
      if (toISODate(start) > to) break
      const e = toEvent(
        calendarId,
        `${event.uid}:${next.toString()}`,
        details.item.summary,
        start,
        details.endDate.toJSDate(),
        details.startDate.isDate,
      )
      if ((e.endDate ?? e.date) >= from) events.push(e)
    }
  }
  return events
}

/** What an iPhone Shortcut sends; dates are ISO 8601 or in the phone's own format. */
interface ShortcutEvent {
  title?: string
  start: string
  end?: string
  allDay?: boolean | string
}

/**
 * Shortcuts sends dates as ISO 8601 ("2026-10-26T10:00:00+02:00") when told to, otherwise in the
 * phone's format, which is day-first here ("26/10/2026, 10:00"). Safari would read that as month/day.
 */
export function parseShortcutDate(text: string) {
  const dayFirst = text.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[,\sat]+(\d{1,2}):(\d{2}))?/)
  if (!dayFirst) return new Date(text)
  const [, day, month, year, hours = '0', minutes = '0'] = dayFirst
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
}

async function get(path: string) {
  const response = await fetch(`${PUSH_API}${path}`)
  if (!response.ok) throw new Error(`Calendar fetch failed: ${response.status}`)
  return response
}

/** Downloads one calendar's events, with when they were last sent (for Shortcut calendars). */
export async function fetchFeed(feed: CalendarFeed): Promise<{ events: ExternalEvent[]; updatedAt?: number }> {
  if (feed.source.type === 'shortcut') {
    const { events, updatedAt } = (await (await get(`/bridge/${feed.source.bridgeId}`)).json()) as {
      events: ShortcutEvent[]
      updatedAt: number | null
    }
    return {
      updatedAt: updatedAt ?? undefined,
      events: events.flatMap((e, i) => {
        const start = parseShortcutDate(e.start)
        if (Number.isNaN(start.getTime())) return []
        const end = e.end ? parseShortcutDate(e.end) : start
        // Shortcuts ends an all-day event at 23:59 of its last day rather than the next midnight.
        const allDay = e.allDay === true || e.allDay === 'true' || e.allDay === 'Yes'
        const exclusiveEnd = allDay ? new Date(end.getTime() + 60_000) : end
        return [toEvent(feed.id, `${feed.id}:${i}`, e.title ?? '', start, exclusiveEnd, allDay)]
      }),
    }
  }
  const url = feed.source.type === 'holidays' ? HOLIDAYS_URL : feed.source.url.trim().replace(/^webcal:/, 'https:')
  const text = await (await get(`/feed?url=${encodeURIComponent(url)}`)).text()
  return { events: parseIcs(text, feed.id) }
}
