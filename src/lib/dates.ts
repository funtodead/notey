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

/** "Thu" within the last week, otherwise "12 Oct". */
export function formatPastDay(iso: string, today: string) {
  const date = parseISODate(iso)
  return daysBetween(iso, today) < 7
    ? date.toLocaleDateString('en-GB', { weekday: 'short' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
