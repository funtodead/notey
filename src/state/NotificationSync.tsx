import { useEffect } from 'react'

import { useCalendars } from '../hooks/useCalendars'
import { useSettings } from '../hooks/useSettings'
import { useStore } from '../hooks/useStore'
import { useTodayDate } from '../hooks/useTodayDate'
import { sendSchedule } from '../lib/push'
import { buildSchedule } from '../lib/schedule'

const DEBOUNCE_MS = 1500

/**
 * Keeps the push Worker's copy of upcoming notifications in step with the data: after every
 * change, and each new day the app is opened (the two-week window moves along). Renders nothing.
 */
export function NotificationSync() {
  const { state } = useStore()
  const { notify } = useSettings().settings
  const { events } = useCalendars()
  const today = useTodayDate()

  useEffect(() => {
    if (!notify) return
    const timer = setTimeout(() => {
      // Offline or the Worker unreachable: the next change or app launch sends it again.
      sendSchedule(notify.deviceId, buildSchedule(state, notify, new Date(), events)).catch(() => {})
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state, notify, events, today])

  return null
}
