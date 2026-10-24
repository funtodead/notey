import type { Bundle, EntityRef, Item, StoreData } from '../types/models'

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
  | { type: 'entities/add'; bundle: Bundle }
  | { type: 'entities/remove'; refs: EntityRef[] }

export function storeReducer(state: StoreData, action: StoreAction): StoreData {
  switch (action.type) {
    case 'entities/add': {
      const { items = [], notes = [], lists = [], listItems = [] } = action.bundle
      return {
        ...state,
        items: [...state.items, ...items],
        notes: [...state.notes, ...notes],
        lists: [...state.lists, ...lists],
        listItems: [...state.listItems, ...listItems],
      }
    }
    case 'entities/remove': {
      const ids = (kind: EntityRef['kind']) =>
        new Set(action.refs.filter((r) => r.kind === kind).map((r) => r.id))
      const [items, notes, lists, listItems] = [ids('item'), ids('note'), ids('list'), ids('listItem')]
      return {
        ...state,
        items: state.items.filter((i) => !items.has(i.id)),
        notes: state.notes.filter((n) => !notes.has(n.id)),
        lists: state.lists.filter((l) => !lists.has(l.id)),
        listItems: state.listItems.filter((li) => !listItems.has(li.id)),
      }
    }
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
