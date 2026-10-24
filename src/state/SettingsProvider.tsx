import { createContext, useEffect, useState, type ReactNode } from 'react'

import { loadSettings, saveSettings } from '../lib/storage'
import type { Settings } from '../types/models'

export const SettingsContext = createContext<{
  settings: Settings
  update: (changes: Partial<Settings>) => void
} | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => saveSettings(settings), [settings])

  const update = (changes: Partial<Settings>) => setSettings((s) => ({ ...s, ...changes }))

  return <SettingsContext value={{ settings, update }}>{children}</SettingsContext>
}
