import { useIonAlert } from '@ionic/react'
import { useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { Switch } from '../../components/ui/Switch'
import { useCalendars } from '../../hooks/useCalendars'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { bridgeUrl, isSupportedLink } from '../../lib/calendars'
import { COLORS } from '../../lib/colors'
import { formatAgo } from '../../lib/dates'
import type { CalendarFeed } from '../../types/models'
import './CalendarsRow.css'

/** Linked calendars: published links (iCloud, Google, Outlook), Israeli holidays, and Shortcut-fed ones. */
export function CalendarsRow() {
  const { settings, update } = useSettings()
  const { status, syncedAt, refresh } = useCalendars()
  const showToast = useToast()
  const [presentAlert] = useIonAlert()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const feeds = settings.calendars ?? []
  const holidays = feeds.find((f) => f.source.type === 'holidays')

  const nextColor = () => {
    const used = new Set(feeds.map((f) => f.color))
    return COLORS.find((c) => !used.has(c.key))?.key ?? 'blue'
  }
  const add = (feed: Omit<CalendarFeed, 'id' | 'color'>) =>
    update({ calendars: [...feeds, { ...feed, id: crypto.randomUUID(), color: nextColor() }] })
  const remove = (feed: CalendarFeed) =>
    update({ calendars: feeds.filter((f) => f.id !== feed.id) })

  const confirmRemove = (feed: CalendarFeed) =>
    void presentAlert({
      header: `Remove “${feed.name}”?`,
      message:
        feed.source.type === 'shortcut'
          ? 'Its Shortcut will stop showing up here; you’d need to set it up again to add it back.'
          : 'Its events disappear from Notey. Your calendar itself isn’t changed.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Remove', role: 'destructive', handler: () => remove(feed) },
      ],
    })

  const copyShortcutAddress = async (bridgeId: string) => {
    await navigator.clipboard.writeText(bridgeUrl(bridgeId))
    showToast({ message: 'Shortcut address copied', icon: 'check' })
  }

  const describe = (feed: CalendarFeed) => {
    const state = status[feed.id]
    if (state?.failed) return 'Couldn’t load — check the link'
    if (feed.source.type === 'shortcut') {
      return state?.updatedAt ? `From Shortcut · sent ${formatAgo(new Date(state.updatedAt).toISOString())}` : 'Waiting for the Shortcut'
    }
    const host = feed.source.type === 'link' ? new URL(feed.source.url.replace(/^webcal:/, 'https:')).hostname : ''
    return host.includes('google') ? 'Google link' : host.includes('icloud') ? 'iCloud link' : 'Outlook link'
  }

  const linkOk = isSupportedLink(link)

  return (
    <div className="settings-group">
      <h2 className="settings-heading">Calendars</h2>
      <section className="calendars clay">
        <div className="calendars-row">
          <span className="calendars-dot tone-amber" aria-hidden="true" />
          <span className="calendars-text">
            <span>Israeli holidays</span>
            <span>From Hebcal</span>
          </span>
          <Switch
            label="Show Israeli holidays"
            checked={!!holidays}
            onChange={(on) => (on ? add({ name: 'חגים', source: { type: 'holidays' } }) : holidays && remove(holidays))}
          />
        </div>

        {feeds
          .filter((f) => f.source.type !== 'holidays')
          .map((feed) => (
            <div key={feed.id} className="calendars-row">
              <span className={`calendars-dot tone-${feed.color}`} aria-hidden="true" />
              <span className="calendars-text">
                <span dir="auto">{feed.name}</span>
                <span className={status[feed.id]?.failed ? 'calendars-failed' : undefined}>{describe(feed)}</span>
              </span>
              {feed.source.type === 'shortcut' && (
                <button
                  className="calendars-icon"
                  aria-label="Copy the Shortcut address"
                  onClick={() => feed.source.type === 'shortcut' && void copyShortcutAddress(feed.source.bridgeId)}
                >
                  <Icon name="copy" size={18} />
                </button>
              )}
              <button className="calendars-icon" aria-label={`Remove ${feed.name}`} onClick={() => confirmRemove(feed)}>
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

        <div className="calendars-add">
          <input
            className="clay-pressed"
            placeholder="Name, e.g. Home"
            aria-label="Calendar name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="clay-pressed"
            placeholder="Paste a calendar link (webcal:// or https://)"
            aria-label="Calendar link"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          {link && !linkOk && <p className="calendars-failed">That doesn’t look like an iCloud, Google or Outlook calendar link.</p>}
          <div className="calendars-add-buttons">
            <button
              disabled={!name.trim() || !linkOk}
              onClick={() => {
                add({ name: name.trim(), source: { type: 'link', url: link.trim() } })
                setName('')
                setLink('')
              }}
            >
              Add link
            </button>
            <button
              disabled={!name.trim()}
              onClick={() => {
                add({ name: name.trim(), source: { type: 'shortcut', bridgeId: crypto.randomUUID() } })
                setName('')
                setLink('')
              }}
            >
              Add via Shortcut
            </button>
          </div>
        </div>
      </section>
      <p className="settings-footnote">
        {feeds.length > 0 && (
          <>
            Updated {syncedAt ? formatAgo(new Date(syncedAt).toISOString()).toLowerCase() : 'never'} ·{' '}
            <button className="calendars-refresh" onClick={refresh}>
              Refresh now
            </button>
            <br />
          </>
        )}
        Shown read-only. Calendars that can’t be shared by link (like a work Exchange one) can be sent in by an iPhone
        Shortcut: add it via Shortcut, then copy its address into the Shortcut.
      </p>
    </div>
  )
}
