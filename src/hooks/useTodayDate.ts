import { useEffect, useState } from 'react'

import { todayISO } from '../lib/dates'

/** Today's date, refreshed when the app comes back to the foreground (e.g. the next morning). */
export function useTodayDate() {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const update = () => setToday(todayISO())
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return today
}
