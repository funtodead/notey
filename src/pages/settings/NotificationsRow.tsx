import { useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { Switch } from '../../components/ui/Switch'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { pushSupported, sendTest, subscribe, unsubscribe } from '../../lib/push'
import { DEFAULT_LEAD_MIN } from '../../lib/schedule'
import type { NotifySettings } from '../../types/models'
import './NotificationsRow.css'

const DEFAULT_MORNING = '08:00'
const DEFAULT_EVENING = '21:00'
const LEADS = [5, 10, 15, 30, 60]

export function NotificationsRow() {
  const { settings, update } = useSettings()
  const showToast = useToast()
  const [busy, setBusy] = useState(false)
  const notify = settings.notify

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try {
      await work()
    } catch {
      showToast({ message: 'Couldn’t reach the notification server', icon: 'alert' })
    } finally {
      setBusy(false)
    }
  }

  const turnOn = () =>
    run(async () => {
      const deviceId = crypto.randomUUID()
      if (!(await subscribe(deviceId))) {
        showToast({ message: 'Notifications are off for Notey in iPhone Settings', icon: 'alert' })
        return
      }
      update({ notify: { deviceId, beforeEvents: true, meetings: true, morning: DEFAULT_MORNING, evening: DEFAULT_EVENING } })
      showToast({ message: 'Notifications are on', icon: 'check' })
    })

  const turnOff = (current: NotifySettings) =>
    run(async () => {
      await unsubscribe(current.deviceId)
      update({ notify: undefined })
    })

  const change = (changes: Partial<NotifySettings>) => notify && update({ notify: { ...notify, ...changes } })

  return (
    <div className="settings-group">
      <h2 className="settings-heading">Notifications</h2>
      <section className="notifications clay">
        {!pushSupported() ? (
          <p className="notifications-note">
            Open Notey from its Home Screen icon to turn on notifications (iOS 16.4 or later).
          </p>
        ) : !notify ? (
          <button className="notifications-on" disabled={busy} onClick={() => void turnOn()}>
            <Icon name="bell" size={18} />
            Turn on notifications
          </button>
        ) : (
          <>
            <div className="notifications-row">
              <span>
                <span>Before events</span>
                <span>A nudge before anything with a time</span>
              </span>
              <Switch
                label="Notify before events"
                checked={notify.beforeEvents}
                onChange={(beforeEvents) => change({ beforeEvents })}
              />
            </div>
            <div className="notifications-row">
              <span>
                <span>Meetings from calendars</span>
                <span>Same nudge for linked calendars, like work</span>
              </span>
              <Switch
                label="Notify before linked calendar meetings"
                checked={!!notify.meetings}
                onChange={(meetings) => change({ meetings })}
              />
            </div>
            {(notify.beforeEvents || notify.meetings) && (
              <div className="notifications-row">
                <span>
                  <span>How early</span>
                  <span>Minutes before it starts</span>
                </span>
                <select
                  className="notifications-time clay-pressed"
                  aria-label="Minutes before events"
                  value={notify.leadMinutes ?? DEFAULT_LEAD_MIN}
                  onChange={(e) => change({ leadMinutes: Number(e.target.value) })}
                >
                  {LEADS.map((m) => (
                    <option key={m} value={m}>
                      {m === 60 ? '1 hour' : `${m} min`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="notifications-row">
              <span>
                <span>Morning summary</span>
                <span>What’s on today, every morning</span>
              </span>
              {notify.morning && (
                <input
                  className="notifications-time clay-pressed"
                  type="time"
                  aria-label="Morning summary time"
                  value={notify.morning}
                  onChange={(e) => e.target.value && change({ morning: e.target.value })}
                />
              )}
              <Switch
                label="Morning summary"
                checked={!!notify.morning}
                onChange={(on) => change({ morning: on ? DEFAULT_MORNING : null })}
              />
            </div>
            <div className="notifications-row">
              <span>
                <span>Evening wrap-up</span>
                <span>What you did and what’s left</span>
              </span>
              {notify.evening && (
                <input
                  className="notifications-time clay-pressed"
                  type="time"
                  aria-label="Evening wrap-up time"
                  value={notify.evening}
                  onChange={(e) => e.target.value && change({ evening: e.target.value })}
                />
              )}
              <Switch
                label="Evening wrap-up"
                checked={!!notify.evening}
                onChange={(on) => change({ evening: on ? DEFAULT_EVENING : null })}
              />
            </div>
            <div className="notifications-actions">
              <button disabled={busy} onClick={() => void run(() => sendTest(notify.deviceId))}>
                Send a test
              </button>
              <button className="notifications-off" disabled={busy} onClick={() => void turnOff(notify)}>
                Turn off
              </button>
            </div>
          </>
        )}
      </section>
      <p className="settings-footnote">
        Say “remind me at 5 to call mom” to get a reminder. Reminder titles and times are stored on your own
        Cloudflare Worker so they can be sent on time.
      </p>
    </div>
  )
}
