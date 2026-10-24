import { parseISODate, toISODate } from './dates'

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** A month laid out Monday-first: blanks (null) before the 1st, then each day's YYYY-MM-DD. */
export function monthCells(year: number, month: number): (string | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => toISODate(new Date(year, month, i + 1))),
  ]
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(iso: string) {
  return (parseISODate(iso).getDay() + 6) % 7
}

export function monthName(year: number, month: number, width: 'long' | 'short' = 'long') {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: width })
}

/** "2026-10" — identifies a month, e.g. to scroll to it. */
export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}
