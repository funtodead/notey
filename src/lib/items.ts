import type { Item } from '../types/models'

/** Timed events first, in time order, then tasks in the order they were added. */
export function compareItems(a: Item, b: Item) {
  if (a.time && b.time) return a.time.localeCompare(b.time)
  if (a.time) return -1
  if (b.time) return 1
  return a.createdAt.localeCompare(b.createdAt)
}
