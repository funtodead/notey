import { useMemo } from 'react'

import { useStore } from './useStore'

export function useCategories() {
  const { categories } = useStore().state

  return useMemo(() => ({ categories, byId: new Map(categories.map((c) => [c.id, c])) }), [categories])
}
