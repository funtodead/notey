import type { Settings, StoreData } from '../types/models'
import { todayISO } from './dates'

/**
 * Settings worth carrying to a fresh install. Not the API key (secret), and not notifications:
 * a reinstalled app gets a new push address, so those are turned on again.
 */
export type BackupSettings = Pick<Settings, 'calendars' | 'appearance'>

interface BackupFile {
  app: 'notey'
  version: 1
  exportedAt: string
  data: StoreData
  /** Missing in backups made before settings were included. */
  settings?: BackupSettings
}

/** A dated JSON file with all data plus calendars and appearance; never the API key. */
export function createBackup(data: StoreData, settings: Settings) {
  const backup: BackupFile = {
    app: 'notey',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
    settings: { calendars: settings.calendars, appearance: settings.appearance },
  }
  return new File([JSON.stringify(backup)], `notey-backup-${todayISO()}.json`, { type: 'application/json' })
}

/** Opens the iOS share sheet (Save to Files, AirDrop, …); falls back to a download elsewhere. */
export async function shareFile(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
    return
  }
  const url = URL.createObjectURL(file)
  const link = Object.assign(document.createElement('a'), { href: url, download: file.name })
  link.click()
  URL.revokeObjectURL(url)
}

/** Reads a backup file; null if it isn't one. */
export async function readBackup(file: File): Promise<BackupFile | null> {
  try {
    const parsed = JSON.parse(await file.text())
    const data = parsed?.data
    const looksRight =
      parsed?.app === 'notey' &&
      ['categories', 'items', 'notes', 'lists', 'listItems'].every((key) => Array.isArray(data?.[key]))
    return looksRight ? parsed : null
  } catch {
    return null
  }
}
