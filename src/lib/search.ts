import type { EntityRef, ExternalEvent, StoreData } from '../types/models'

const MAX_HITS = 60

export interface SearchHits {
  refs: EntityRef[]
  events: ExternalEvent[]
}

/**
 * Everything whose text contains the query: items (coming up first, then the most recent),
 * notes, list items and lists, then linked-calendar events from today on.
 */
export function search(state: StoreData, events: ExternalEvent[], query: string, today: string): SearchHits {
  const q = query.trim().toLowerCase()
  if (!q) return { refs: [], events: [] }
  const has = (...texts: (string | undefined)[]) => texts.some((t) => t?.toLowerCase().includes(q))

  const items = state.items
    .filter((i) => has(i.title))
    .sort((a, b) => {
      const aPast = (a.endDate ?? a.date) < today && !a.repeat
      const bPast = (b.endDate ?? b.date) < today && !b.repeat
      if (aPast !== bPast) return aPast ? 1 : -1
      return aPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    })
  const refs: EntityRef[] = [
    ...items.map((i) => ({ kind: 'item' as const, id: i.id })),
    ...state.notes.filter((n) => has(n.text, n.body)).map((n) => ({ kind: 'note' as const, id: n.id })),
    ...state.lists.filter((l) => has(l.name)).map((l) => ({ kind: 'list' as const, id: l.id })),
    ...state.listItems.filter((li) => has(li.text, li.qty)).map((li) => ({ kind: 'listItem' as const, id: li.id })),
  ].slice(0, MAX_HITS)

  return {
    refs,
    events: events
      .filter((e) => (e.endDate ?? e.date) >= today && has(e.title))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      .slice(0, MAX_HITS - refs.length),
  }
}
