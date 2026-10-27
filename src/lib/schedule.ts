import type { CalendarFeed, ExternalEvent, NotifySettings, StoreData } from '../types/models'
import { eventsOn } from './calendars'
import { addDays, parseISODate, toISODate } from './dates'
import { itemsOn } from './items'
import type { ScheduledNotification } from './push'

/** How far ahead to schedule; the app refreshes this whenever it's opened or data changes. */
const DAYS_AHEAD = 14
export const DEFAULT_LEAD_MIN = 15
const MAX = 500
/** Lines listed in a summary before "+N more". */
const MAX_LINES = 6

const at = (date: string, time: string) => {
  const [h, m] = time.split(':').map(Number)
  const d = parseISODate(date)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const capped = (lines: string[]) =>
  lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES - 1), `+${lines.length - MAX_LINES + 1} more`] : lines

const star = (item: { starred?: boolean }) => (item.starred ? '⭐ ' : '')

/** "09:00–10:00 Standup (Sheba)" */
const eventLine = (e: { title: string; time?: string; endTime?: string; source?: string; starred?: boolean }) =>
  `${star(e)}${e.time ? `${e.time}${e.endTime ? `–${e.endTime}` : ''} ` : ''}${e.title}${e.source ? ` (${e.source})` : ''}`

/**
 * Every notification due in the next two weeks: reminders, nudges before events (Notey's own and,
 * if turned on, linked calendars' meetings), and the morning summary and evening wrap-up.
 */
export function buildSchedule(
  state: StoreData,
  notify: NotifySettings,
  now: Date,
  external: ExternalEvent[] = [],
  feeds: CalendarFeed[] = [],
): ScheduledNotification[] {
  const out: ScheduledNotification[] = []
  const today = toISODate(now)
  const lead = notify.leadMinutes ?? DEFAULT_LEAD_MIN
  const inLead = lead === 60 ? 'In an hour' : `In ${lead} min`
  const categoryName = new Map(state.categories.map((c) => [c.id, c.name]))
  const feedName = new Map(feeds.map((f) => [f.id, f.name]))

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const date = addDays(today, d)
    const all = itemsOn(state.items, date)
    const items = all.filter((i) => !(i.kind === 'task' && i.done))

    for (const item of items) {
      if (!item.time) continue
      const where = categoryName.get(item.categoryId)
      if (item.remind) {
        out.push({
          id: `r:${item.id}:${date}`,
          at: at(date, item.time),
          title: `${star(item)}${item.title}`,
          body: ['Reminder', item.time, where].filter(Boolean).join(' · '),
        })
      } else if (notify.beforeEvents && item.kind === 'event') {
        out.push({
          id: `e:${item.id}:${date}`,
          at: at(date, item.time) - lead * 60_000,
          title: `${star(item)}${item.title}`,
          body: [inLead, item.time, where].filter(Boolean).join(' · '),
        })
      }
    }

    const linked = eventsOn(external, date)
    if (notify.meetings) {
      for (const e of linked) {
        // Only on its first day; all-day ones have no time to nudge before.
        if (!e.time || e.date !== date) continue
        out.push({
          id: `x:${e.id}:${date}`,
          at: at(date, e.time) - lead * 60_000,
          title: e.title,
          body: [inLead, e.endTime ? `${e.time}–${e.endTime}` : e.time, feedName.get(e.calendarId)]
            .filter(Boolean)
            .join(' · '),
        })
      }
    }

    const tasks = items.filter((i) => i.kind === 'task')
    const overdue = state.items.filter((i) => i.kind === 'task' && !i.done && !i.endDate && !i.repeat && i.date < date)

    if (notify.morning && items.length + linked.length + overdue.length > 0) {
      const events = [
        ...items.filter((i) => i.kind === 'event'),
        ...linked.map((e) => ({ ...e, source: feedName.get(e.calendarId) })),
      ].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
      const counts = [
        events.length > 0 && plural(events.length, 'event'),
        tasks.length > 0 && plural(tasks.length, 'task'),
      ].filter(Boolean)
      const lines = capped([
        ...events.map(eventLine),
        ...tasks.map((t) => `☐ ${star(t)}${t.title}${t.time ? ` · ${t.time}` : ''}`),
      ])
      if (overdue.length) lines.push(`⚠️ ${overdue.length} overdue from before`)
      out.push({
        id: `m:${date}`,
        at: at(date, notify.morning),
        title: counts.length ? `Today · ${counts.join(', ')}` : 'Today',
        body: lines.join('\n'),
      })
    }

    const allTasks = all.filter((i) => i.kind === 'task')
    if (notify.evening && allTasks.length > 0) {
      const done = allTasks.filter((t) => t.done)
      const left = allTasks.filter((t) => !t.done)
      const tomorrow = itemsOn(state.items, addDays(date, 1)).find((i) => i.kind === 'event' && i.time)
      const lines = [
        ...capped([...left.map((t) => `☐ ${star(t)}${t.title}`), ...done.map((t) => `✓ ${t.title}`)]),
        ...(tomorrow ? [`Tomorrow: ${eventLine(tomorrow)}`] : []),
      ]
      out.push({
        id: `w:${date}`,
        at: at(date, notify.evening),
        title:
          left.length === 0
            ? `All done · ${plural(done.length, 'task')} ✓`
            : `Done ${done.length} of ${allTasks.length} · ${left.length} left`,
        body: lines.join('\n'),
      })
    }
  }

  return out
    .filter((n) => n.at > now.getTime())
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX)
}

/** Tasks still to do today, for the number on the app icon. */
export function tasksLeftToday(state: StoreData, today: string) {
  return itemsOn(state.items, today).filter((i) => i.kind === 'task' && !i.done).length
}
