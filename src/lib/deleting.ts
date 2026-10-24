import type { Bundle, EntityRef, Item, StoreData } from '../types/models'
import { addDays, formatMediumDate } from './dates'
import { describeRef, type FiledSummary } from './filing'
import type { Deletion } from './groq'
import { repeatLabel } from './recurrence'

// Keeps the prompt small: what the user is likely to mean, newest and soonest first.
const MAX_ITEMS = 120
const MAX_NOTES = 60
const MAX_LIST_ITEMS = 120

/** One line per thing the user might ask to delete, with a short ref the AI answers with. */
export function existingContext(state: StoreData, today: string) {
  const lines: string[] = []
  const refs = new Map<string, EntityRef>()
  const add = (ref: string, entity: EntityRef, text: string) => {
    refs.set(ref, entity)
    lines.push(`${ref}: ${text}`)
  }

  const recent = addDays(today, -14)
  state.items
    .filter((i) => i.repeat || (i.endDate ?? i.date) >= recent || (i.kind === 'task' && !i.done))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_ITEMS)
    .forEach((item, n) => {
      const when = item.repeat
        ? `${repeatLabel(item).toLowerCase()}, repeating from ${item.date}`
        : item.endDate
          ? `${item.date} to ${item.endDate}`
          : `on ${item.date}`
      add(`i${n + 1}`, { kind: 'item', id: item.id }, `${item.kind} "${item.title}" ${when}${item.time ? ` at ${item.time}` : ''}`)
    })

  state.notes
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_NOTES)
    .forEach((note, n) => add(`n${n + 1}`, { kind: 'note', id: note.id }, `note "${note.text}"`))

  state.lists.forEach((list, n) => add(`l${n + 1}`, { kind: 'list', id: list.id }, `list "${list.name}"`))

  const listName = new Map(state.lists.map((l) => [l.id, l.name]))
  state.listItems
    .filter((li) => !li.done)
    .slice(0, MAX_LIST_ITEMS)
    .forEach((li, n) =>
      add(`li${n + 1}`, { kind: 'listItem', id: li.id }, `"${li.text}" on list ${listName.get(li.listId)}`),
    )

  return { lines, refs }
}

/** What applying the AI's deletions does to the store, and what Undo needs to put back. */
export interface Removal {
  remove: EntityRef[]
  /** Repeating items with one day skipped. */
  skips: { id: string; skipDates: string[] }[]
  /** Records as they were, to restore on Undo. */
  restore: { bundle: Bundle; items: Item[] }
  summaries: FiledSummary[]
}

export function planDeletions(
  deletions: Deletion[],
  refs: Map<string, EntityRef>,
  state: StoreData,
  today: string,
): Removal {
  const removal: Removal = {
    remove: [],
    skips: [],
    restore: { bundle: { items: [], notes: [], lists: [], listItems: [] }, items: [] },
    summaries: [],
  }
  const seen = new Set<string>()

  for (const { ref, date } of deletions) {
    const entity = refs.get(ref)
    if (!entity || seen.has(entity.id)) continue
    seen.add(entity.id)

    // Things can be gone by the time the AI answers; those are skipped.
    if (entity.kind === 'list') {
      const list = state.lists.find((l) => l.id === entity.id)
      if (!list) continue
      const items = state.listItems.filter((li) => li.listId === list.id)
      removal.remove.push(entity, ...items.map((li) => ({ kind: 'listItem' as const, id: li.id })))
      removal.restore.bundle.lists!.push(list)
      removal.restore.bundle.listItems!.push(...items)
      removal.summaries.push({ title: list.name, where: `List · ${items.length} items`, icon: 'lists', color: list.color })
      continue
    }

    const summary = describeRef(entity, state, today)
    if (!summary) continue
    const item = entity.kind === 'item' ? state.items.find((i) => i.id === entity.id) : undefined
    if (item?.repeat && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      removal.skips.push({ id: item.id, skipDates: [...(item.skipDates ?? []), date] })
      removal.restore.items.push(item)
      removal.summaries.push({ ...summary, where: `${formatMediumDate(date)} only · ${summary.where.split(' · ')[1]}` })
      continue
    }

    removal.remove.push(entity)
    removal.summaries.push(summary)
    if (item) removal.restore.bundle.items!.push(item)
    const note = entity.kind === 'note' && state.notes.find((n) => n.id === entity.id)
    if (note) removal.restore.bundle.notes!.push(note)
    const listItem = entity.kind === 'listItem' && state.listItems.find((li) => li.id === entity.id)
    if (listItem) removal.restore.bundle.listItems!.push(listItem)
  }
  return removal
}
