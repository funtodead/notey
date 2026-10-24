import { useIonAlert } from '@ionic/react'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { useSettings } from '../../hooks/useSettings'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { createBackup, readBackup, shareFile } from '../../lib/backup'
import { formatAgo } from '../../lib/dates'
import './BackupRow.css'

/** Export everything to a file (to keep in iCloud Drive), or restore from one. */
export function BackupRow() {
  const { state, dispatch } = useStore()
  const { settings, update } = useSettings()
  const showToast = useToast()
  const [presentAlert] = useIonAlert()
  const fileInput = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState(false)

  useEffect(() => {
    void navigator.storage?.persisted().then(setPersisted)
  }, [])

  const exportBackup = async () => {
    try {
      await shareFile(createBackup(state))
      update({ lastBackupAt: new Date().toISOString() })
    } catch (e) {
      // Closing the share sheet without saving isn't an error.
      if (!(e instanceof DOMException && e.name === 'AbortError')) throw e
    }
  }

  const importBackup = async (file: File) => {
    const backup = await readBackup(file)
    if (!backup) {
      showToast({ message: 'That file isn’t a Notey backup', icon: 'alert' })
      return
    }
    void presentAlert({
      header: 'Restore this backup?',
      message: `Everything in Notey will be replaced with the backup from ${new Date(backup.exportedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Restore',
          role: 'destructive',
          handler: () => {
            dispatch({ type: 'store/replace', data: backup.data })
            showToast({ message: 'Backup restored', icon: 'check' })
          },
        },
      ],
    })
  }

  return (
    <div className="settings-group">
      <h2 className="settings-heading">Backup</h2>
      <section className="backup clay">
        <button className="backup-row" onClick={() => void exportBackup()}>
          <span className="backup-icon tone-green" aria-hidden="true">
            <Icon name="upload" size={18} />
          </span>
          <span className="backup-text">
            <span>Export backup</span>
            <span>Last backup: {settings.lastBackupAt ? formatAgo(settings.lastBackupAt) : 'Never'}</span>
          </span>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </button>
        <button className="backup-row" onClick={() => fileInput.current?.click()}>
          <span className="backup-icon tone-blue" aria-hidden="true">
            <Icon name="download" size={18} />
          </span>
          <span className="backup-text">
            <span>Import backup</span>
            <span>Replaces what’s in Notey now</span>
          </span>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void importBackup(file)
          }}
        />
      </section>
      <p className="settings-footnote">Your API key isn’t included. Save backups to Files › iCloud Drive to keep them safe.</p>
      <p className="settings-footnote backup-storage">
        <Icon name={persisted ? 'check' : 'alert'} size={14} strokeWidth={2.6} />
        {persisted
          ? 'Storage protected: iOS won’t clear Notey’s data to free up space.'
          : 'Storage not marked protected by iOS yet. Open Notey from its Home Screen icon, and keep backups.'}
      </p>
    </div>
  )
}
