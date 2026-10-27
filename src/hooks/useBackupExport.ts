import { createBackup, shareFile } from '../lib/backup'
import { useSettings } from './useSettings'
import { useStore } from './useStore'

/** Opens the share sheet with a backup file, and remembers when one was made. */
export function useBackupExport() {
  const { state } = useStore()
  const { settings, update } = useSettings()

  return async () => {
    try {
      await shareFile(createBackup(state, settings))
      update({ lastBackupAt: new Date().toISOString() })
    } catch (e) {
      // Closing the share sheet without saving isn't an error.
      if (!(e instanceof DOMException && e.name === 'AbortError')) throw e
    }
  }
}
