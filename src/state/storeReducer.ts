import type { Item, StoreData } from '../types/models'

export const initialData: StoreData = {
  categories: [
    { id: 'personal', name: 'Personal', color: 'coral' },
    { id: 'work', name: 'Work', color: 'blue' },
    { id: 'hobbies', name: 'Hobbies', color: 'green' },
    { id: 'side-hustles', name: 'Side hustles', color: 'amber' },
  ],
  items: [],
  notes: [],
  lists: [],
  listItems: [],
}

export type StoreAction =
  | { type: 'items/add'; items: Item[] }
  | { type: 'items/update'; id: string; changes: Partial<Item> }
  | { type: 'items/remove'; id: string }

export function storeReducer(state: StoreData, action: StoreAction): StoreData {
  switch (action.type) {
    case 'items/add':
      return { ...state, items: [...state.items, ...action.items] }
    case 'items/update':
      return {
        ...state,
        items: state.items.map((item) => (item.id === action.id ? { ...item, ...action.changes } : item)),
      }
    case 'items/remove':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) }
  }
}
