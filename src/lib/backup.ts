import type { StoreData } from '../types/models'
import { todayISO } from './dates'

interface BackupFile {
  app: 'notey'
  version: 1
  exportedAt: string
  data: StoreData
}

/** A dated JSON file with everything except the API key (that lives in settings, not the store). */
export function createBackup(data: StoreData) {
  const backup: BackupFile = { app: 'notey', version: 1, exportedAt: new Date().toISOString(), data }
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
