import { useMemo } from 'react'

import { itemsOn } from '../lib/items'
import type { Item } from '../types/models'
import { useStore } from './useStore'

export type SpanItem = Item & { endDate: string }

/**
 * What's on a date: single-day items (repeating ones as that day's occurrence),
 * and multi-day events that cover it.
 */
export function useDay(date: string) {
  const { items } = useStore().state

  return useMemo(
    () => ({
      items: itemsOn(items, date),
      spans: items.filter((i): i is SpanItem => !!i.endDate && i.date <= date && date <= i.endDate),
    }),
    [items, date],
  )
}
