import { IonModal, useIonRouter } from '@ionic/react'
import { useMemo, useRef, useState } from 'react'

import { EditFiled } from '../../components/items/EditFiled'
import { Icon } from '../../components/ui/Icon'
import { useCalendars } from '../../hooks/useCalendars'
import { useSettings } from '../../hooks/useSettings'
import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { formatMediumDate } from '../../lib/dates'
import { refile } from '../../lib/filing'
import { search } from '../../lib/search'
import type { EntityRef } from '../../types/models'
import { FiledRow } from '../mic/FiledRow'
import './SearchSheet.css'

/** Finds anything by its text; tap a result to fix it (or open its list). */
export function SearchSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useIonRouter()
  const { state, dispatch } = useStore()
  const { events } = useCalendars()
  const feeds = useSettings().settings.calendars ?? []
  const today = useTodayDate()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<EntityRef | null>(null)

  const hits = useMemo(() => search(state, events, query, today), [state, events, query, today])
  const feedById = new Map(feeds.map((f) => [f.id, f]))

  const open = (ref: EntityRef) => {
    if (ref.kind !== 'list') return setEditing(ref)
    onClose()
    router.push(`/lists/${ref.id}`)
  }

  return (
    <IonModal
      className="search-modal"
      isOpen={isOpen}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      onDidPresent={() => input.current?.focus()}
      onDidDismiss={() => {
        setQuery('')
        onClose()
      }}
    >
      <section className="search" aria-label="Search">
        <div className="search-bar clay-pressed">
          <Icon name="search" size={18} />
          <input
            ref={input}
            type="search"
            placeholder="Search everything"
            aria-label="Search everything"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-cancel" onClick={onClose}>
            Done
          </button>
        </div>

        <div className="search-results">
          {hits.refs.map((ref) => (
            <FiledRow key={ref.id} entity={ref} onClick={() => open(ref)} />
          ))}
          {hits.events.map((event) => {
            const feed = feedById.get(event.calendarId)
            return (
              <div key={event.id} className={`filed-row tone-${feed?.color ?? 'blue'}`}>
                <span className="filed-row-icon" aria-hidden="true">
                  <Icon name="calendar" size={20} />
                </span>
                <span className="filed-row-text">
                  <span className="filed-row-title" dir="auto">
                    {event.title}
                  </span>
                  <span className="filed-row-where">
                    {event.date === today ? 'Today' : formatMediumDate(event.date)}
                    {event.time && `, ${event.time}`} · {feed?.name}
                  </span>
                </span>
              </div>
            )
          })}
          {query.trim() && hits.refs.length + hits.events.length === 0 && (
            <p className="search-empty">Nothing matches “{query.trim()}”.</p>
          )}
        </div>
      </section>

      <EditFiled
        entity={editing}
        onClose={() => setEditing(null)}
        onSave={(draft) => {
          if (!editing) return
          dispatch({ type: 'entities/remove', refs: [editing] })
          dispatch({ type: 'entities/add', bundle: refile(editing, draft, state).bundle })
        }}
        onRemove={() => editing && dispatch({ type: 'entities/remove', refs: [editing] })}
      />
    </IonModal>
  )
}
