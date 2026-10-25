import type { ExternalEvent, NotifySettings, StoreData } from '../types/models'
import { eventsOn } from './calendars'
import { addDays, parseISODate, toISODate } from './dates'
import { itemsOn } from './items'
import type { ScheduledNotification } from './push'

/** How far ahead to schedule; the app refreshes this whenever it's opened or data changes. */
const DAYS_AHEAD = 14
const BEFORE_EVENT_MIN = 15
const MAX = 500

const at = (date: string, time: string) => {
  const [h, m] = time.split(':').map(Number)
  const d = parseISODate(date)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/**
 * Every notification due in the next two weeks: reminders, event nudges and morning summaries.
 * Events from linked calendars only appear in the summary; their own calendar app already alerts for them.
 */
export function buildSchedule(
  state: StoreData,
  notify: NotifySettings,
  now: Date,
  external: ExternalEvent[] = [],
): ScheduledNotification[] {
  const out: ScheduledNotification[] = []
  const today = toISODate(now)

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const date = addDays(today, d)
    const items = itemsOn(state.items, date).filter((i) => !(i.kind === 'task' && i.done))

    for (const item of items) {
      if (!item.time) continue
      if (item.remind) {
        out.push({ id: `r:${item.id}:${date}`, at: at(date, item.time), title: item.title, body: `Reminder · ${item.time}` })
      } else if (notify.beforeEvents && item.kind === 'event') {
        out.push({
          id: `e:${item.id}:${date}`,
          at: at(date, item.time) - BEFORE_EVENT_MIN * 60_000,
          title: item.title,
          body: `In ${BEFORE_EVENT_MIN} minutes · ${item.time}`,
        })
      }
    }

    const linked = eventsOn(external, date)
    if (notify.morning && items.length + linked.length > 0) {
      const events = [...items.filter((i) => i.kind === 'event'), ...linked]
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
        .map((e) => (e.time ? `${e.time} ${e.title}` : e.title))
      const tasks = items.filter((i) => i.kind === 'task').length
      const parts = [...events, ...(tasks ? [`${tasks} ${tasks === 1 ? 'task' : 'tasks'}`] : [])]
      out.push({ id: `m:${date}`, at: at(date, notify.morning), title: 'Today', body: parts.join(' · ') })
    }
  }

  return out
    .filter((n) => n.at > now.getTime())
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX)
}
