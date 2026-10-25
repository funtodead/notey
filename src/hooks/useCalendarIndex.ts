import { useMemo } from 'react'

import { addDays } from '../lib/dates'
import { occursOn } from '../lib/recurrence'
import type { ColorKey } from '../types/models'
import { useCalendars } from './useCalendars'
import { useCategories } from './useCategories'
import { useSettings } from './useSettings'
import type { SpanItem } from './useDay'
import { useStore } from './useStore'

export interface DayInfo {
  /** Category colors of the day's single-day items, at most 3. */
  colors: ColorKey[]
  /** The first multi-day event covering the day. */
  span?: { item: SpanItem; color: ColorKey }
}

/** What each date between `from` and `to` has on it, for drawing the month and year grids. */
export function useCalendarIndex(from: string, to: string) {
  const { items } = useStore().state
  const { byId } = useCategories()
  const { events } = useCalendars()
  const feeds = useSettings().settings.calendars

  return useMemo(() => {
    const index = new Map<string, DayInfo>()
    const at = (date: string) => {
      let info = index.get(date)
      if (!info) index.set(date, (info = { colors: [] }))
      return info
    }
    const addColor = (date: string, color: ColorKey) => {
      const info = at(date)
      if (info.colors.length < 3 && !info.colors.includes(color)) info.colors.push(color)
    }

    for (const item of items) {
      const color = byId.get(item.categoryId)?.color ?? 'lavender'
      if (item.endDate) {
        for (let day = item.date; day <= item.endDate; day = addDays(day, 1)) {
          const info = at(day)
          info.span ??= { item: item as SpanItem, color }
        }
      } else if (item.repeat) {
        const last = item.repeat.until && item.repeat.until < to ? item.repeat.until : to
        for (let day = item.date > from ? item.date : from; day <= last; day = addDays(day, 1)) {
          if (occursOn(item, day)) addColor(day, color)
        }
      } else {
        addColor(item.date, color)
      }
    }

    // Linked calendars get a dot in their own color on each day they cover.
    const feedColor = new Map((feeds ?? []).map((f) => [f.id, f.color]))
    for (const event of events) {
      const color = feedColor.get(event.calendarId)
      if (!color) continue
      for (let day = event.date; day <= (event.endDate ?? event.date); day = addDays(day, 1)) addColor(day, color)
    }
    return index
  }, [items, byId, events, feeds, from, to])
}
