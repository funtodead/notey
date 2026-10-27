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
  /** Makes `date` the first of a series. */
  repeat?: Repeat
  /** Occurrences checked off, for repeating tasks (`done` is unused for those). */
  doneDates?: string[]
  /** Occurrences deleted on their own ("only this one"). */
  skipDates?: string[]
  /** Send a notification at `time` ("remind me at 5 to…"). */
  remind?: boolean
  /** Important: shown first, with a star. */
  starred?: boolean
}

export interface Repeat {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  /** 1 = every, 2 = every other, … */
  interval: number
  /** YYYY-MM-DD, last possible occurrence */
  until?: string
}

export interface Note {
  id: string
  /** The note's title line. */
  text: string
  body?: string
  categoryId: string
  createdAt: string
}

export interface List {
  id: string
  name: string
  emoji: string
  color: ColorKey
  createdAt: string
  /** Created by the AI rather than from the New list sheet. */
  byNotey?: boolean
}

export interface ListItem {
  id: string
  listId: string
  text: string
  /** Free-form amount, e.g. "2 L" or "12". */
  qty?: string
  done: boolean
  createdAt?: string
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

export type Appearance = 'dark' | 'light' | 'system'

/** Present once notifications are turned on. */
export interface NotifySettings {
  /** Random id this phone is known by on the push Worker. */
  deviceId: string
  /** A nudge 15 minutes before events with a time. */
  beforeEvents: boolean
  /** HH:mm for the morning summary, or null for none. */
  morning: string | null
}

/** A calendar from outside Notey, shown read-only. */
export interface CalendarFeed {
  id: string
  name: string
  color: ColorKey
  source:
    | { type: 'link'; url: string }
    /** Israeli holidays from Hebcal. */
    | { type: 'holidays' }
    /** Events an iPhone Shortcut posts to the Worker, for calendars that can't be shared by link. */
    | { type: 'shortcut'; bridgeId: string }
}

/** One event from a calendar feed, already expanded for repeats and converted to local time. */
export interface ExternalEvent {
  id: string
  calendarId: string
  title: string
  /** YYYY-MM-DD */
  date: string
  /** YYYY-MM-DD, when it spans several days */
  endDate?: string
  /** HH:mm; none for all-day */
  time?: string
  endTime?: string
}

export interface Settings {
  groqKey: string
  notify?: NotifySettings
  calendars?: CalendarFeed[]
  /** Dark when not set. */
  appearance?: Appearance
  /** ISO timestamp of the last backup export. */
  lastBackupAt?: string
  /** ISO timestamp until which the "back up" banner on Today stays hidden ("Later"). */
  backupSnoozedUntil?: string
}
