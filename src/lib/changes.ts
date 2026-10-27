import type { Bundle, EntityRef, Item, StoreData } from '../types/models'
import { addDays, daysBetween, formatMediumDate } from './dates'
import { describeRef, type FiledSummary } from './filing'
import type { Deletion, Update } from './groq'
import { repeatLabel } from './recurrence'

// Keeps the prompt small: what the user is likely to mean, newest and soonest first.
const MAX_ITEMS = 120
const MAX_NOTES = 60
const MAX_LIST_ITEMS = 120

const isDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
const isTime = (value: string | null): value is string => !!value && /^\d{2}:\d{2}$/.test(value)

/** One line per thing the user might ask to change or delete, with a short ref the AI answers with. */
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
      const done = (item.repeat
        ? item.doneDates?.includes(today) ? ' (done today)' : ''
        : item.done ? ' (done)' : '') + (item.starred ? ' (starred)' : '')
      add(
        `i${n + 1}`,
        { kind: 'item', id: item.id },
        `${item.kind} "${item.title}" ${when}${item.time ? ` at ${item.time}` : ''}${done}`,
      )
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

/** What the AI's deletions and updates do to the store, and what Undo needs to put back. */
export interface ChangePlan {
  remove: EntityRef[]
  /** Records to put in place of the stored ones with the same id (edited, or a repeating day skipped). */
  replace: Required<Bundle>
  /** Originals, for Undo: deleted records to add back, and replaced records as they were. */
  restore: { added: Required<Bundle>; replaced: Required<Bundle> }
  /** Things deleted, as they looked before. */
  removed: FiledSummary[]
  /** Things edited (still in the store). */
  changed: EntityRef[]
}

const emptyBundle = (): Required<Bundle> => ({ items: [], notes: [], lists: [], listItems: [] })

const KEY = { item: 'items', note: 'notes', list: 'lists', listItem: 'listItems' } as const

export function planChanges(
  deletions: Deletion[],
  updates: Update[],
  refs: Map<string, EntityRef>,
  state: StoreData,
  today: string,
): ChangePlan {
  const plan: ChangePlan = {
    remove: [],
    replace: emptyBundle(),
    restore: { added: emptyBundle(), replaced: emptyBundle() },
    removed: [],
    changed: [],
  }
  const removedIds = new Set<string>()
  const categoryIds = new Set(state.categories.map((c) => c.id))

  // The record as already changed by this plan, or as stored; undefined once gone.
  const current = <K extends keyof typeof KEY>(kind: K, id: string) => {
    const key = KEY[kind]
    const pending = (plan.replace[key] as { id: string }[]).find((r) => r.id === id)
    return (pending ?? (state[key] as { id: string }[]).find((r) => r.id === id)) as
      | Required<Bundle>[(typeof KEY)[K]][number]
      | undefined
  }

  // Puts an edited copy in the plan, keeping the original for Undo the first time.
  const replace = <K extends keyof typeof KEY>(kind: K, record: Required<Bundle>[(typeof KEY)[K]][number]) => {
    const key = KEY[kind]
    const list = plan.replace[key] as { id: string }[]
    const index = list.findIndex((r) => r.id === record.id)
    if (index >= 0) list[index] = record
    else {
      list.push(record)
      const original = (state[key] as { id: string }[]).find((r) => r.id === record.id)!
      ;(plan.restore.replaced[key] as { id: string }[]).push(original)
    }
  }

  for (const { ref, date } of deletions) {
    const entity = refs.get(ref)
    // Things can be gone by the time the AI answers; those are skipped.
    if (!entity || removedIds.has(entity.id)) continue

    if (entity.kind === 'list') {
      const list = state.lists.find((l) => l.id === entity.id)
      const summary = describeRef(entity, state, today)
      if (!list || !summary) continue
      const items = state.listItems.filter((li) => li.listId === list.id)
      removedIds.add(list.id)
      plan.remove.push(entity, ...items.map((li) => ({ kind: 'listItem' as const, id: li.id })))
      plan.restore.added.lists.push(list)
      plan.restore.added.listItems.push(...items)
      plan.removed.push(summary)
      continue
    }

    const summary = describeRef(entity, state, today)
    if (!summary) continue
    const item = entity.kind === 'item' ? current('item', entity.id) : undefined
    if (item?.repeat && isDate(date)) {
      replace('item', { ...item, skipDates: [...(item.skipDates ?? []), date] })
      plan.removed.push({ ...summary, where: `${formatMediumDate(date)} only · ${summary.where.split(' · ')[1]}` })
      continue
    }

    removedIds.add(entity.id)
    plan.remove.push(entity)
    plan.removed.push(summary)
    if (item) plan.restore.added.items.push(item)
    const note = entity.kind === 'note' && state.notes.find((n) => n.id === entity.id)
    if (note) plan.restore.added.notes.push(note)
    const listItem = entity.kind === 'listItem' && state.listItems.find((li) => li.id === entity.id)
    if (listItem) plan.restore.added.listItems.push(listItem)
  }

  for (const update of updates) {
    const entity = refs.get(update.ref)
    if (!entity || removedIds.has(entity.id)) continue
    const title = update.title?.trim() || undefined
    const category = update.category && categoryIds.has(update.category) ? update.category : undefined
    const details = update.details?.trim() || undefined

    if (entity.kind === 'item') {
      const item = current('item', entity.id)
      if (!item) continue
      const next: Item = { ...item }
      if (title) next.title = title
      if (category) next.categoryId = category
      if (isDate(update.date)) {
        // A multi-day event keeps its length when moved.
        if (next.endDate) next.endDate = addDays(next.endDate, daysBetween(item.date, update.date))
        next.date = update.date
      }
      if (isTime(update.time)) next.time = update.time
      if (update.done !== null) {
        if (item.repeat) {
          const day = isDate(update.occurrence) ? update.occurrence : today
          const doneDates = (item.doneDates ?? []).filter((d) => d !== day)
          next.doneDates = update.done ? [...doneDates, day] : doneDates
        } else next.done = update.done
      }
      if (update.starred === true) next.starred = true
      if (update.starred === false) delete next.starred
      replace('item', next)
    } else if (entity.kind === 'note') {
      const note = current('note', entity.id)
      if (!note) continue
      replace('note', { ...note, text: title ?? note.text, body: details ?? note.body, categoryId: category ?? note.categoryId })
    } else if (entity.kind === 'listItem') {
      const listItem = current('listItem', entity.id)
      if (!listItem) continue
      replace('listItem', {
        ...listItem,
        text: title ?? listItem.text,
        qty: details ?? listItem.qty,
        done: update.done ?? listItem.done,
      })
    } else {
      const list = current('list', entity.id)
      if (!list) continue
      replace('list', { ...list, name: title ?? list.name })
    }
    if (!plan.changed.some((r) => r.id === entity.id)) plan.changed.push(entity)
  }
  return plan
}
