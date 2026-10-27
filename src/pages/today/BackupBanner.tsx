import { Icon } from '../../components/ui/Icon'
import { useBackupExport } from '../../hooks/useBackupExport'
import { useSettings } from '../../hooks/useSettings'
import { useStore } from '../../hooks/useStore'
import { formatAgo } from '../../lib/dates'
import './BackupBanner.css'

const DAY_MS = 24 * 60 * 60 * 1000
const REMIND_AFTER_DAYS = 7
const SNOOZE_DAYS = 3

/** A nudge on Today when the last backup is over a week old (and there's something to lose). */
export function BackupBanner() {
  const { items, notes, lists } = useStore().state
  const { settings, update } = useSettings()
  const exportBackup = useBackupExport()

  const now = Date.now()
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : null
  const snoozed = settings.backupSnoozedUntil && new Date(settings.backupSnoozedUntil).getTime() > now
  const due = last === null || now - last > REMIND_AFTER_DAYS * DAY_MS
  const hasData = items.length + notes.length + lists.length > 0
  if (!due || snoozed || !hasData) return null

  return (
    <section className="backup-banner clay-sm" aria-label="Backup reminder">
      <span className="backup-banner-icon tone-green" aria-hidden="true">
        <Icon name="upload" size={18} />
      </span>
      <span className="backup-banner-text">
        <span>Time for a backup</span>
        <span>{settings.lastBackupAt ? `Last one ${formatAgo(settings.lastBackupAt).toLowerCase()}` : 'You haven’t made one yet'}</span>
      </span>
      <button
        className="backup-banner-later"
        onClick={() => update({ backupSnoozedUntil: new Date(now + SNOOZE_DAYS * DAY_MS).toISOString() })}
      >
        Later
      </button>
      <button className="backup-banner-go" onClick={() => void exportBackup()}>
        Back up
      </button>
    </section>
  )
}
