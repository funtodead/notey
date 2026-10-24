import type { Item } from '../types/models'
import { daysBetween, parseISODate } from './dates'

const lastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

/**
 * Whether a repeating item happens on `date`. Monthly and yearly repeats on the 29th–31st
 * fall on the month's last day when it's shorter.
 */
export function occursOn(item: Item, date: string) {
  const repeat = item.repeat
  if (!repeat || date < item.date || (repeat.until && date > repeat.until) || item.skipDates?.includes(date)) {
    return false
  }
  const every = Math.max(1, repeat.interval)
  const start = parseISODate(item.date)
  const day = parseISODate(date)
  const sameDayOfMonth = day.getDate() === Math.min(start.getDate(), lastDayOfMonth(day))

  switch (repeat.freq) {
    case 'daily':
      return daysBetween(item.date, date) % every === 0
    case 'weekly': {
      const days = daysBetween(item.date, date)
      return days % 7 === 0 && (days / 7) % every === 0
    }
    case 'monthly': {
      const months = (day.getFullYear() - start.getFullYear()) * 12 + day.getMonth() - start.getMonth()
      return months % every === 0 && sameDayOfMonth
    }
    case 'yearly':
      return (day.getFullYear() - start.getFullYear()) % every === 0 && day.getMonth() === start.getMonth() && sameDayOfMonth
  }
}

/** The item as it appears on one day of its series. */
export function occurrence(item: Item, date: string): Item {
  return { ...item, date, done: item.kind === 'task' && !!item.doneDates?.includes(date) }
}

const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

/** "Every Monday", "Every other Monday", "Monthly on the 1st", "Every year on 24 Oct", … */
export function repeatLabel(item: Item) {
  const repeat = item.repeat
  if (!repeat) return ''
  const n = Math.max(1, repeat.interval)
  const start = parseISODate(item.date)
  const weekday = start.toLocaleDateString('en-GB', { weekday: 'long' })

  switch (repeat.freq) {
    case 'daily':
      return n === 1 ? 'Every day' : `Every ${n} days`
    case 'weekly':
      return n === 1 ? `Every ${weekday}` : n === 2 ? `Every other ${weekday}` : `Every ${n} weeks on ${weekday}`
    case 'monthly':
      return n === 1 ? `Monthly on the ${ordinal(start.getDate())}` : `Every ${n} months on the ${ordinal(start.getDate())}`
    case 'yearly':
      return `Every year on ${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  }
}
