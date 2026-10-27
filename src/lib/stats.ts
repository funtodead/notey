import type { Category, Item, StoreData } from '../types/models'
import { addDays } from './dates'
import { itemsOn } from './items'
import { occursOn } from './recurrence'

/** How far back the streak of a repeating task is counted. */
const STREAK_LOOKBACK = 365

export interface DayCount {
  date: string
  done: number
  total: number
}

export interface Stats {
  /** Tasks done and planned on each of the last 7 days, oldest first. */
  week: DayCount[]
  /** Days in a row, up to today, with at least one task done (today counts once something is). */
  streak: number
  /** Tasks done in the last 30 days, by category, most first. */
  byCategory: { category: Category; done: number }[]
  /** Repeating tasks and how many times in a row they've been done. */
  habits: { item: Item; streak: number }[]
}

const tasksOn = (items: Item[], date: string) => itemsOn(items, date).filter((i) => i.kind === 'task')

/** Completion is counted against each task's own day; Notey doesn't record when it was checked off. */
export function buildStats(state: StoreData, today: string): Stats {
  const count = (date: string): DayCount => {
    const tasks = tasksOn(state.items, date)
    return { date, done: tasks.filter((t) => t.done).length, total: tasks.length }
  }

  const week = Array.from({ length: 7 }, (_, i) => count(addDays(today, i - 6)))

  let streak = 0
  for (let date = count(today).done ? today : addDays(today, -1); count(date).done > 0; date = addDays(date, -1)) {
    streak++
    if (streak >= STREAK_LOOKBACK) break
  }

  const doneByCategory = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    for (const task of tasksOn(state.items, addDays(today, -i))) {
      if (task.done) doneByCategory.set(task.categoryId, (doneByCategory.get(task.categoryId) ?? 0) + 1)
    }
  }
  const byCategory = state.categories
    .map((category) => ({ category, done: doneByCategory.get(category.id) ?? 0 }))
    .filter((c) => c.done > 0)
    .sort((a, b) => b.done - a.done)

  const habits = state.items
    .filter((i) => i.kind === 'task' && i.repeat && (!i.repeat.until || i.repeat.until >= addDays(today, -7)))
    .map((item) => ({ item, streak: habitStreak(item, today) }))
    .sort((a, b) => b.streak - a.streak)

  return { week, streak, byCategory, habits }
}

/** Occurrences done in a row, going back from today; today's doesn't break it before it's done. */
function habitStreak(item: Item, today: string) {
  const done = new Set(item.doneDates)
  const skipped = new Set(item.skipDates)
  let streak = 0
  for (let i = 0; i < STREAK_LOOKBACK; i++) {
    const date = addDays(today, -i)
    if (date < item.date) break
    if (skipped.has(date) || !occursOn(item, date)) continue
    if (done.has(date)) streak++
    else if (date !== today) break
  }
  return streak
}
