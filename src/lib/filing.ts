import type { Bundle, ColorKey, EntityRef, Item, List, Repeat, StoreData } from '../types/models'
import { formatMediumDate } from './dates'
import type { FiledEntry } from './groq'
import { repeatLabel } from './recurrence'

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

    const details = entry.details?.trim() || undefined

    if (entry.type === 'note') {
      bundle.notes.push({ id, text: entry.title, body: details, categoryId, createdAt })
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
          byNotey: true,
        }
        lists.push(list)
        bundle.lists.push(list)
        refs.push({ kind: 'list', id: list.id })
      }
      bundle.listItems.push({ id, listId: list.id, text: entry.title, qty: details, done: false, createdAt })
      refs.push({ kind: 'listItem', id })
    } else {
      const date = isDate(entry.date) ? entry.date : today
      const item: Item = { id, kind: entry.type, title: entry.title, categoryId, date, done: false, createdAt }
      if (isDate(entry.end_date) && entry.end_date > date) item.endDate = entry.end_date
      if (isTime(entry.time)) item.time = entry.time
      if (entry.remind && item.time) item.remind = true
      if (entry.starred) item.starred = true
      if (entry.repeat && !item.endDate) {
        item.repeat = { freq: entry.repeat, interval: Math.max(1, entry.repeat_interval ?? 1) }
        if (isDate(entry.repeat_until) && entry.repeat_until >= date) item.repeat.until = entry.repeat_until
      }
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
  icon: 'today' | 'calendar' | 'repeat' | 'bell' | 'notes' | 'lists'
  color: ColorKey
}

/** How a filed record is shown in the mic sheet; null once it has been deleted. */
export function describeRef(ref: EntityRef, state: StoreData, today: string): FiledSummary | null {
  const category = (id: string) => state.categories.find((c) => c.id === id)

  if (ref.kind === 'item') {
    const item = state.items.find((i) => i.id === ref.id)
    if (!item) return null
    const cat = category(item.categoryId)
    const day = item.repeat
      ? repeatLabel(item)
      : item.endDate
        ? `${formatMediumDate(item.date)} – ${formatMediumDate(item.endDate)}`
        : item.date === today
          ? 'Today'
          : formatMediumDate(item.date)
    return {
      title: item.title,
      where: `${day}${item.time ? `, ${item.time}` : ''} · ${cat?.name ?? ''}`,
      icon: item.remind ? 'bell' : item.repeat ? 'repeat' : item.date === today && !item.endDate ? 'today' : 'calendar',
      color: cat?.color ?? 'lavender',
    }
  }
  if (ref.kind === 'note') {
    const note = state.notes.find((n) => n.id === ref.id)
    if (!note) return null
    const cat = category(note.categoryId)
    return { title: note.text, where: `Notes · ${cat?.name ?? ''}`, icon: 'notes', color: cat?.color ?? 'lavender' }
  }
  if (ref.kind === 'list') {
    const list = state.lists.find((l) => l.id === ref.id)
    if (!list) return null
    const count = state.listItems.filter((li) => li.listId === list.id).length
    return { title: list.name, where: `List · ${count} ${count === 1 ? 'item' : 'items'}`, icon: 'lists', color: list.color }
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
  kind: Item['kind']
  starred: boolean
  date: string
  listId: string
  categoryId: string
  /** For a dated item; null = happens once. */
  repeat: Repeat | null
  /** HH:mm, or null for no time. */
  time: string | null
  /** Notify at `time`. */
  remind: boolean
}

export function draftFor(ref: EntityRef, state: StoreData, today: string): Draft {
  const base: Draft = {
    title: '',
    dest: 'day',
    kind: 'task',
    starred: false,
    date: today,
    listId: state.lists[0]?.id ?? '',
    categoryId: state.categories[0].id,
    repeat: null,
    time: null,
    remind: false,
  }
  const item = ref.kind === 'item' && state.items.find((i) => i.id === ref.id)
  if (item) {
    return {
      ...base,
      title: item.title,
      kind: item.kind,
      starred: !!item.starred,
      date: item.date,
      categoryId: item.categoryId,
      repeat: item.repeat ?? null,
      time: item.time ?? null,
      remind: !!item.remind,
    }
  }
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
    const old = state.notes.find((n) => n.id === id)
    const note = { ...(old ?? { id, createdAt }), text: draft.title, categoryId: draft.categoryId }
    return { bundle: { notes: [note] }, ref: { kind: 'note', id } }
  }
  if (draft.dest === 'list') {
    const old = state.listItems.find((li) => li.id === id)
    const listItem = { ...(old ?? { id, done: false, createdAt }), listId: draft.listId, text: draft.title }
    return { bundle: { listItems: [listItem] }, ref: { kind: 'listItem', id } }
  }
  const old = ref.kind === 'item' ? state.items.find((i) => i.id === id) : undefined
  const item: Item = {
    ...(old ?? { id, done: false, createdAt }),
    kind: draft.kind,
    title: draft.title,
    categoryId: draft.categoryId,
    date: draft.date,
  }
  if (item.endDate && item.endDate <= item.date) delete item.endDate
  if (draft.repeat && !item.endDate) item.repeat = draft.repeat
  else delete item.repeat
  if (draft.time) item.time = draft.time
  else delete item.time
  if (draft.remind && item.time) item.remind = true
  else delete item.remind
  if (draft.starred) item.starred = true
  else delete item.starred
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
