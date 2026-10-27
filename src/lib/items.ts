import type { Item } from '../types/models'
import { occurrence, occursOn } from './recurrence'

/** Starred first, then timed events in time order, then tasks in the order they were added. */
export function compareItems(a: Item, b: Item) {
  if (!!a.starred !== !!b.starred) return a.starred ? -1 : 1
  if (a.time && b.time) return a.time.localeCompare(b.time)
  if (a.time) return -1
  if (b.time) return 1
  return a.createdAt.localeCompare(b.createdAt)
}

/** Single-day items on a date, repeating ones as that day's occurrence, sorted. */
export function itemsOn(items: Item[], date: string) {
  return items
    .flatMap((i) => {
      if (i.endDate) return []
      if (i.repeat) return occursOn(i, date) ? [occurrence(i, date)] : []
      return i.date === date ? [i] : []
    })
    .sort(compareItems)
}
