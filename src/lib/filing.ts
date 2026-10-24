import type { Bundle, ColorKey, EntityRef, Item, List, StoreData } from '../types/models'
import { formatMediumDate } from './dates'
import type { FiledEntry } from './groq'

const LIST_COLORS: ColorKey[] = ['green', 'blue', 'amber', 'rose', 'aqua', 'lavender', 'coral', 'sand']

const isDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
const isTime = (value: string | null): value is string => !!value && /^\d{2}:\d{2}$/.test(value)

/** Turns what the AI returned into new records, and refs to them in the order they were mentioned. */
export function toBundle(entries: FiledEntry[], state: StoreData, today: string) {
  const createdAt = new Date().toISOString()
  const bundle: Required<Bundle> = { items: [], notes: [], lists: [], listItems: [] }
  const refs: EntityRef[] = []
  const lists = [...state.lists]
  const categoryIds = new Set(state.categories.map((c) => c.id))

  for (const entry of entries) {
    const id = crypto.randomUUID()
    const categoryId = categoryIds.has(entry.category) ? entry.category : state.categories[0].id

    if (entry.type === 'note') {
      bundle.notes.push({ id, text: entry.title, categoryId, createdAt })
      refs.push({ kind: 'note', id })
    } else if (entry.type === 'list_item') {
      const name = entry.list?.trim() || 'Shopping'
      let list = lists.find((l) => l.name.toLowerCase() === name.toLowerCase())
      if (!list) {
        list = {
          id: crypto.randomUUID(),
          name,
          emoji: entry.list_emoji ?? '📝',
          color: LIST_COLORS[lists.length % LIST_COLORS.length],
          createdAt,
        }
        lists.push(list)
        bundle.lists.push(list)
        refs.push({ kind: 'list', id: list.id })
      }
      bundle.listItems.push({ id, listId: list.id, text: entry.title, done: false })
      refs.push({ kind: 'listItem', id })
    } else {
      const date = isDate(entry.date) ? entry.date : today
      const item: Item = { id, kind: entry.type, title: entry.title, categoryId, date, done: false, createdAt }
      if (isDate(entry.end_date) && entry.end_date > date) item.endDate = entry.end_date
      if (isTime(entry.time)) item.time = entry.time
      bundle.items.push(item)
      refs.push({ kind: 'item', id })
    }
  }
  return { bundle, refs }
}

export interface FiledSummary {
  title: string
  /** "Today · Personal", "Tue 27 Oct, 15:00 · Work", "Lists › Shopping" */
  where: string
  icon: 'today' | 'calendar' | 'notes' | 'lists'
  color: ColorKey
}

/** How a filed record is shown in the mic sheet; null once it has been deleted. */
export function describeRef(ref: EntityRef, state: StoreData, today: string): FiledSummary | null {
  const category = (id: string) => state.categories.find((c) => c.id === id)

  if (ref.kind === 'item') {
    const item = state.items.find((i) => i.id === ref.id)
    if (!item) return null
    const cat = category(item.categoryId)
    const day = item.endDate
      ? `${formatMediumDate(item.date)} – ${formatMediumDate(item.endDate)}`
      : item.date === today
        ? 'Today'
        : formatMediumDate(item.date)
    return {
      title: item.title,
      where: `${day}${item.time ? `, ${item.time}` : ''} · ${cat?.name ?? ''}`,
      icon: item.date === today && !item.endDate ? 'today' : 'calendar',
      color: cat?.color ?? 'lavender',
    }
  }
  if (ref.kind === 'note') {
    const note = state.notes.find((n) => n.id === ref.id)
    if (!note) return null
    const cat = category(note.categoryId)
    return { title: note.text, where: `Notes · ${cat?.name ?? ''}`, icon: 'notes', color: cat?.color ?? 'lavender' }
  }
  if (ref.kind === 'listItem') {
    const listItem = state.listItems.find((li) => li.id === ref.id)
    const list = listItem && state.lists.find((l) => l.id === listItem.listId)
    if (!listItem || !list) return null
    return { title: listItem.text, where: `Lists › ${list.name}`, icon: 'lists', color: list.color }
  }
  return null
}

/** What the "Fix this item" sheet edits. */
export interface Draft {
  title: string
  dest: 'day' | 'note' | 'list'
  date: string
  listId: string
  categoryId: string
}

export function draftFor(ref: EntityRef, state: StoreData, today: string): Draft {
  const base: Draft = {
    title: '',
    dest: 'day',
    date: today,
    listId: state.lists[0]?.id ?? '',
    categoryId: state.categories[0].id,
  }
  const item = ref.kind === 'item' && state.items.find((i) => i.id === ref.id)
  if (item) return { ...base, title: item.title, date: item.date, categoryId: item.categoryId }
  const note = ref.kind === 'note' && state.notes.find((n) => n.id === ref.id)
  if (note) return { ...base, title: note.text, dest: 'note', categoryId: note.categoryId }
  const listItem = ref.kind === 'listItem' && state.listItems.find((li) => li.id === ref.id)
  if (listItem) return { ...base, title: listItem.text, dest: 'list', listId: listItem.listId }
  return base
}

/**
 * Re-files a record as edited. Keeps the same id, so it's a remove + add even when only
 * the title changed; switching between Today, Notes and a list changes the record's kind.
 */
export function refile(ref: EntityRef, draft: Draft, state: StoreData): { bundle: Bundle; ref: EntityRef } {
  const { id } = ref
  const createdAt = new Date().toISOString()

  if (draft.dest === 'note') {
    return { bundle: { notes: [{ id, text: draft.title, categoryId: draft.categoryId, createdAt }] }, ref: { kind: 'note', id } }
  }
  if (draft.dest === 'list') {
    return {
      bundle: { listItems: [{ id, listId: draft.listId, text: draft.title, done: false }] },
      ref: { kind: 'listItem', id },
    }
  }
  const old = ref.kind === 'item' ? state.items.find((i) => i.id === id) : undefined
  const item: Item = {
    ...(old ?? { id, kind: 'task', done: false, createdAt }),
    title: draft.title,
    categoryId: draft.categoryId,
    date: draft.date,
  }
  if (item.endDate && item.endDate <= item.date) delete item.endDate
  return { bundle: { items: [item] }, ref: { kind: 'item', id } }
}

/** Lists this filing created that would be left empty if its records were removed. */
export function emptiedLists(refs: EntityRef[], state: StoreData): List[] {
  const removed = new Set(refs.filter((r) => r.kind === 'listItem').map((r) => r.id))
  const created = new Set(refs.filter((r) => r.kind === 'list').map((r) => r.id))
  return state.lists.filter(
    (l) => created.has(l.id) && state.listItems.every((li) => li.listId !== l.id || removed.has(li.id)),
  )
}
