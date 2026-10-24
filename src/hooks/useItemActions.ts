import type { Item } from '../types/models'
import { useStore } from './useStore'
import { useToast } from './useToast'

export function useItemActions() {
  const { dispatch } = useStore()
  const showToast = useToast()

  return {
    toggleDone: (item: Item) => dispatch({ type: 'items/update', id: item.id, changes: { done: !item.done } }),

    moveTo: (item: Item, date: string) => dispatch({ type: 'items/update', id: item.id, changes: { date } }),

    remove: (item: Item) => {
      dispatch({ type: 'items/remove', id: item.id })
      showToast({
        message: `Deleted “${item.title}”`,
        onUndo: () => dispatch({ type: 'items/add', items: [item] }),
      })
    },
  }
}
