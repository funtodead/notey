import type { List, ListItem } from '../types/models'
import { useStore } from './useStore'
import { useToast } from './useToast'

export function useListActions() {
  const { state, dispatch } = useStore()
  const showToast = useToast()

  const removeItems = (items: ListItem[], message: string) => {
    dispatch({ type: 'entities/remove', refs: items.map((i) => ({ kind: 'listItem', id: i.id })) })
    showToast({ message, onUndo: () => dispatch({ type: 'entities/add', bundle: { listItems: items } }) })
  }

  return {
    create: (list: Omit<List, 'id' | 'createdAt'>) => {
      const created: List = { ...list, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      dispatch({ type: 'entities/add', bundle: { lists: [created] } })
      return created
    },

    update: (list: List, changes: Partial<List>) => dispatch({ type: 'lists/update', id: list.id, changes }),

    /** Deletes the list and everything on it. */
    remove: (list: List) => {
      const items = state.listItems.filter((i) => i.listId === list.id)
      dispatch({
        type: 'entities/remove',
        refs: [{ kind: 'list', id: list.id }, ...items.map((i) => ({ kind: 'listItem' as const, id: i.id }))],
      })
      showToast({
        message: `Deleted list “${list.name}”`,
        onUndo: () => dispatch({ type: 'entities/add', bundle: { lists: [list], listItems: items } }),
      })
    },

    addItem: (list: List, text: string) =>
      dispatch({
        type: 'entities/add',
        bundle: {
          listItems: [
            { id: crypto.randomUUID(), listId: list.id, text, done: false, createdAt: new Date().toISOString() },
          ],
        },
      }),

    toggleItem: (item: ListItem) => dispatch({ type: 'listItems/update', id: item.id, changes: { done: !item.done } }),

    removeItem: (item: ListItem) => removeItems([item], `Deleted “${item.text}”`),

    clearDone: (items: ListItem[]) =>
      removeItems(items, `Cleared ${items.length} done ${items.length === 1 ? 'item' : 'items'}`),
  }
}
