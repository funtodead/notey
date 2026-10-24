export type ColorKey = 'coral' | 'blue' | 'green' | 'amber' | 'lavender' | 'rose' | 'aqua' | 'sand'

export interface Category {
  id: string
  name: string
  color: ColorKey
}

/** Something on a date: a task to check off, or an event at a time. */
export interface Item {
  id: string
  kind: 'task' | 'event'
  title: string
  categoryId: string
  /** YYYY-MM-DD */
  date: string
  /** YYYY-MM-DD, for events spanning several days */
  endDate?: string
  /** HH:mm */
  time?: string
  done: boolean
  createdAt: string
}

export interface Note {
  id: string
  text: string
  categoryId: string
  createdAt: string
}

export interface List {
  id: string
  name: string
  emoji: string
  color: ColorKey
  createdAt: string
}

export interface ListItem {
  id: string
  listId: string
  text: string
  done: boolean
}

export interface StoreData {
  categories: Category[]
  items: Item[]
  notes: Note[]
  lists: List[]
  listItems: ListItem[]
}

/** New records to add in one go, e.g. everything the AI filed from one message. */
export type Bundle = Partial<Omit<StoreData, 'categories'>>

/** Points at one stored record, so it can be shown, edited or removed later. */
export interface EntityRef {
  kind: 'item' | 'note' | 'list' | 'listItem'
  id: string
}

export interface Settings {
  groqKey: string
}
