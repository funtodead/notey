import { COLORS } from '../lib/colors'
import type { Category } from '../types/models'
import { useStore } from './useStore'

export function useCategoryActions() {
  const { state, dispatch } = useStore()

  return {
    /** Adds "New category" in the first color not taken yet, and returns it. */
    add: () => {
      const used = new Set(state.categories.map((c) => c.color))
      const color = COLORS.find((c) => !used.has(c.key))?.key ?? COLORS[0].key
      const category: Category = { id: crypto.randomUUID(), name: 'New category', color }
      dispatch({ type: 'categories/add', category })
      return category
    },

    update: (category: Category, changes: Partial<Category>) =>
      dispatch({ type: 'categories/update', id: category.id, changes }),

    remove: (category: Category) => dispatch({ type: 'categories/remove', id: category.id }),
  }
}
