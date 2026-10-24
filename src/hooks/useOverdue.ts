import { useMemo } from 'react'

import { useStore } from './useStore'

/** Unfinished tasks from days before `today`, oldest first. */
export function useOverdue(today: string) {
  const { items } = useStore().state

  return useMemo(
    () =>
      items
        .filter((i) => i.kind === 'task' && !i.done && !i.endDate && i.date < today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [items, today],
  )
}
