/** Dates are stored as local "YYYY-MM-DD" strings, which also sort correctly as text. */

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

/** Parses as a local date (new Date('YYYY-MM-DD') would be UTC midnight). */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(from: string, to: string) {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000)
}

/** "Saturday 24 October" */
export function formatLongDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "Thu 22" */
export function formatShortDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

/** "Tue 27 Oct" */
export function formatMediumDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Every date from `first` to `last` that falls inside `from`–`to`. Stops on malformed dates and
 * after a bounded number of days, so bad data can never loop forever.
 */
export function daysWithin(first: string, last: string, from: string, to: string) {
  const days: string[] = []
  if (!ISO_DATE.test(first) || !ISO_DATE.test(last)) return days
  const end = last < to ? last : to
  for (let day = first > from ? first : from; day <= end && days.length < 800; day = addDays(day, 1)) days.push(day)
  return days
}

export function addDays(iso: string, days: number) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** "Just now", "5 min ago", "2 h ago", "Yesterday", "Mon", "12 Oct" — for a full ISO timestamp. */
export function formatAgo(timestamp: string, now = new Date()) {
  const then = new Date(timestamp)
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const days = daysBetween(toISODate(then), toISODate(now))
  if (days === 0) return `${Math.floor(minutes / 60)} h ago`
  if (days === 1) return 'Yesterday'
  return formatPastDay(toISODate(then), toISODate(now))
}

/** "Thu" within the last week, otherwise "12 Oct". */
export function formatPastDay(iso: string, today: string) {
  const date = parseISODate(iso)
  return daysBetween(iso, today) < 7
    ? date.toLocaleDateString('en-GB', { weekday: 'short' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
