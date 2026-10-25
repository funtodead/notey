import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { useSettings } from '../hooks/useSettings'
import { fetchFeed } from '../lib/calendars'
import type { ExternalEvent } from '../types/models'

const CACHE_KEY = 'notey:calendars'
const STALE_MS = 10 * 60_000

interface FeedStatus {
  /** When the Shortcut last sent events (Shortcut calendars only). */
  updatedAt?: number
  failed?: boolean
}

interface Cache {
  events: ExternalEvent[]
  status: Record<string, FeedStatus>
  syncedAt: number | null
}

export const CalendarsContext = createContext<(Cache & { refresh: () => void }) | null>(null)

function loadCache(): Cache {
  const raw = localStorage.getItem(CACHE_KEY)
  return raw ? (JSON.parse(raw) as Cache) : { events: [], status: {}, syncedAt: null }
}

/** Events from linked calendars, kept on the phone so they show offline, refreshed when stale. */
export function CalendarsProvider({ children }: { children: ReactNode }) {
  const feeds = useSettings().settings.calendars
  const [cache, setCache] = useState(loadCache)
  const syncing = useRef(false)

  const refresh = useCallback(async () => {
    if (syncing.current) return
    syncing.current = true
    const list = feeds ?? []
    const results = await Promise.allSettled(list.map(fetchFeed))
    setCache((previous) => {
      const next: Cache = { events: [], status: {}, syncedAt: Date.now() }
      list.forEach((feed, i) => {
        const result = results[i]
        if (result.status === 'fulfilled') {
          next.events.push(...result.value.events)
          next.status[feed.id] = { updatedAt: result.value.updatedAt }
        } else {
          // Keep what we had for a calendar that couldn't be reached this time.
          next.events.push(...previous.events.filter((e) => e.calendarId === feed.id))
          next.status[feed.id] = { ...previous.status[feed.id], failed: true }
        }
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      return next
    })
    syncing.current = false
  }, [feeds])

  // On launch and whenever the calendars change in Settings.
  useEffect(() => {
    void refresh()
  }, [refresh])

  // Coming back to the app after a while.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - (cache.syncedAt ?? 0) > STALE_MS) void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh, cache.syncedAt])

  return <CalendarsContext value={{ ...cache, refresh: () => void refresh() }}>{children}</CalendarsContext>
}
