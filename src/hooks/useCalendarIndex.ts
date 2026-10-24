import { useMemo } from 'react'

import { addDays } from '../lib/dates'
import type { ColorKey } from '../types/models'
import { useCategories } from './useCategories'
import type { SpanItem } from './useDay'
import { useStore } from './useStore'

export interface DayInfo {
  /** Category colors of the day's single-day items, at most 3. */
  colors: ColorKey[]
  /** The first multi-day event covering the day. */
  span?: { item: SpanItem; color: ColorKey }
}

/** What each date has on it, for drawing the month and year grids. */
export function useCalendarIndex() {
  const { items } = useStore().state
  const { byId } = useCategories()

  return useMemo(() => {
    const index = new Map<string, DayInfo>()
    const at = (date: string) => {
      let info = index.get(date)
      if (!info) index.set(date, (info = { colors: [] }))
      return info
    }

    for (const item of items) {
      const color = byId.get(item.categoryId)?.color ?? 'lavender'
      if (item.endDate) {
        for (let day = item.date; day <= item.endDate; day = addDays(day, 1)) {
          const info = at(day)
          info.span ??= { item: item as SpanItem, color }
        }
      } else {
        const info = at(item.date)
        if (info.colors.length < 3 && !info.colors.includes(color)) info.colors.push(color)
      }
    }
    return index
  }, [items, byId])
}
