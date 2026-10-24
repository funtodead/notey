import type { Bundle, Category, EntityRef, Item, List, ListItem, Note, StoreData } from '../types/models'

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
  | { type: 'notes/update'; id: string; changes: Partial<Note> }
  | { type: 'lists/update'; id: string; changes: Partial<List> }
  | { type: 'listItems/update'; id: string; changes: Partial<ListItem> }
  | { type: 'entities/add'; bundle: Bundle }
  | { type: 'entities/remove'; refs: EntityRef[] }
  | { type: 'categories/add'; category: Category }
  | { type: 'categories/update'; id: string; changes: Partial<Category> }
  | { type: 'categories/remove'; id: string }
  /** Restoring a backup. */
  | { type: 'store/replace'; data: StoreData }

const updateById = <T extends { id: string }>(records: T[], id: string, changes: Partial<T>) =>
  records.map((r) => (r.id === id ? { ...r, ...changes } : r))

export function storeReducer(state: StoreData, action: StoreAction): StoreData {
  switch (action.type) {
    case 'categories/add':
      return { ...state, categories: [...state.categories, action.category] }
    case 'categories/update':
      return { ...state, categories: updateById(state.categories, action.id, action.changes) }
    case 'categories/remove':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) }
    case 'store/replace':
      return action.data
    case 'notes/update':
      return { ...state, notes: updateById(state.notes, action.id, action.changes) }
    case 'lists/update':
      return { ...state, lists: updateById(state.lists, action.id, action.changes) }
    case 'listItems/update':
      return { ...state, listItems: updateById(state.listItems, action.id, action.changes) }
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
      return { ...state, items: updateById(state.items, action.id, action.changes) }
    case 'items/remove':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) }
  }
}
