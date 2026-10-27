import { IonModal } from '@ionic/react'
import { useState, type ReactNode } from 'react'

import { Icon } from '../ui/Icon'
import { Switch } from '../ui/Switch'
import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { addDays, formatMediumDate } from '../../lib/dates'
import { draftFor, type Draft } from '../../lib/filing'
import type { EntityRef, Repeat } from '../../types/models'
import './EditFiled.css'

interface EditFiledProps {
  /** The record being fixed; null when the sheet is closed. */
  entity: EntityRef | null
  onClose: () => void
  onSave: (draft: Draft) => void
  /** Left out for something new, which has nothing to remove yet. */
  onRemove?: () => void
}

const REPEATS: { id: Repeat['freq'] | 'never'; label: string }[] = [
  { id: 'never', label: 'Never' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

const KINDS: { id: Draft['kind']; label: string }[] = [
  { id: 'task', label: 'To do' },
  { id: 'event', label: 'Event' },
]

const DESTINATIONS: { id: Draft['dest']; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'note', label: 'Notes' },
  { id: 'list', label: 'List' },
]

/**
 * "Fix this item" sheet: rename a thing, move it to another place, day, list or category, or make it repeat.
 * Also the "New item" sheet, when `entity` points at an id that isn't stored yet.
 */
export function EditFiled({ entity, onClose, onSave, onRemove }: EditFiledProps) {
  const { state } = useStore()
  const today = useTodayDate()
  const [draft, setDraft] = useState<Draft | null>(null)

  const set = (changes: Partial<Draft>) => setDraft((d) => d && { ...d, ...changes })
  const tomorrow = addDays(today, 1)
  const canSave = !!draft?.title.trim() && (draft.dest !== 'list' || !!draft.listId)

  return (
    <IonModal
      className="edit-filed-modal"
      isOpen={!!entity}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      onWillPresent={() => entity && setDraft(draftFor(entity, state, today))}
      onDidDismiss={onClose}
    >
      {draft && (
        <section className="edit-filed" aria-label="Edit filed item">
          <div className="edit-filed-header">
            <h2>{onRemove ? 'Fix this item' : 'New item'}</h2>
            <span className="edit-filed-header-end">
              {draft.dest === 'day' && (
                <button
                  className={`edit-filed-star ${draft.starred ? 'edit-filed-star-on' : ''}`}
                  aria-label="Important"
                  aria-pressed={draft.starred}
                  onClick={() => set({ starred: !draft.starred })}
                >
                  <Icon name="star" size={22} />
                </button>
              )}
              {onRemove && (
                <button
                  className="edit-filed-remove"
                  onClick={() => {
                    onRemove()
                    onClose()
                  }}
                >
                  Remove
                </button>
              )}
            </span>
          </div>

          <label htmlFor="edit-title" className="visually-hidden">
            Item
          </label>
          <input
            id="edit-title"
            className="edit-filed-title clay-pressed"
            placeholder="What is it?"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />

          <fieldset>
            <legend>Put it in</legend>
            <div className="edit-filed-segments clay-pressed">
              {DESTINATIONS.map((d) => (
                <button
                  key={d.id}
                  className={draft.dest === d.id ? 'clay-sm' : undefined}
                  aria-pressed={draft.dest === d.id}
                  onClick={() => set({ dest: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          {draft.dest === 'day' && (
            <div className="edit-filed-segments clay-pressed" role="group" aria-label="Type">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  className={draft.kind === k.id ? 'clay-sm' : undefined}
                  aria-pressed={draft.kind === k.id}
                  onClick={() => set({ kind: k.id })}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {draft.dest === 'day' && (
            <fieldset>
              <legend>When</legend>
              <div className="edit-filed-chips">
                <Chip on={draft.date === today} onClick={() => set({ date: today })}>
                  Today
                </Chip>
                <Chip on={draft.date === tomorrow} onClick={() => set({ date: tomorrow })}>
                  Tomorrow
                </Chip>
                <label className={`edit-filed-chip ${draft.date !== today && draft.date !== tomorrow ? 'edit-filed-chip-on' : ''}`}>
                  {draft.date !== today && draft.date !== tomorrow ? formatMediumDate(draft.date) : 'Pick date…'}
                  <input type="date" value={draft.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
                </label>
              </div>
            </fieldset>
          )}

          {draft.dest === 'day' && (
            <fieldset>
              <legend>Time</legend>
              <div className="edit-filed-time">
                <label className={`edit-filed-chip ${draft.time ? 'edit-filed-chip-on' : ''}`}>
                  {draft.time ?? 'Add time…'}
                  <input
                    type="time"
                    value={draft.time ?? ''}
                    onChange={(e) => set({ time: e.target.value || null })}
                  />
                </label>
                {draft.time && (
                  <button className="edit-filed-chip" onClick={() => set({ time: null, remind: false })}>
                    No time
                  </button>
                )}
                <span className="edit-filed-remind">
                  <Icon name="bell" size={16} />
                  Remind me
                  <Switch
                    label="Remind me"
                    checked={draft.remind && !!draft.time}
                    // A reminder needs a time; 09:00 unless one is set.
                    onChange={(remind) => set({ remind, time: draft.time ?? (remind ? '09:00' : null) })}
                  />
                </span>
              </div>
            </fieldset>
          )}

          {draft.dest === 'day' && (
            <fieldset>
              <legend>Repeat</legend>
              <div className="edit-filed-chips">
                {REPEATS.map((r) => {
                  const on = (draft.repeat?.freq ?? 'never') === r.id
                  return (
                    <Chip
                      key={r.id}
                      on={on}
                      onClick={() =>
                        set({
                          repeat: r.id === 'never' ? null : { ...draft.repeat, freq: r.id, interval: draft.repeat?.interval ?? 1 },
                        })
                      }
                    >
                      {r.label}
                    </Chip>
                  )
                })}
              </div>
            </fieldset>
          )}

          {draft.dest === 'list' && (
            <fieldset>
              <legend>Which list</legend>
              <div className="edit-filed-chips">
                {state.lists.length === 0 && <span className="edit-filed-empty">No lists yet</span>}
                {state.lists.map((list) => (
                  <Chip key={list.id} on={draft.listId === list.id} onClick={() => set({ listId: list.id })}>
                    {list.emoji} {list.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          {draft.dest !== 'list' && (
            <fieldset>
              <legend>Category</legend>
              <div className="edit-filed-chips">
                {state.categories.map((c) => (
                  <button
                    key={c.id}
                    className={`edit-filed-category tone-${c.color} ${draft.categoryId === c.id ? 'edit-filed-category-on' : ''}`}
                    aria-pressed={draft.categoryId === c.id}
                    onClick={() => set({ categoryId: c.id })}
                  >
                    <span aria-hidden="true" />
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <button
            className="edit-filed-save"
            disabled={!canSave}
            onClick={() => {
              onSave({ ...draft, title: draft.title.trim() })
              onClose()
            }}
          >
            Save
          </button>
        </section>
      )}
    </IonModal>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`edit-filed-chip ${on ? 'edit-filed-chip-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}
