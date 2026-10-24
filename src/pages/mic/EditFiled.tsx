import { IonModal } from '@ionic/react'
import { useState, type ReactNode } from 'react'

import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { addDays, formatMediumDate } from '../../lib/dates'
import { draftFor, type Draft } from '../../lib/filing'
import type { EntityRef } from '../../types/models'
import './EditFiled.css'

interface EditFiledProps {
  target: { messageId: string; ref: EntityRef } | null
  onClose: () => void
  onSave: (draft: Draft) => void
  onRemove: () => void
}

const DESTINATIONS: { id: Draft['dest']; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'note', label: 'Notes' },
  { id: 'list', label: 'List' },
]

/** "Fix this item" sheet: rename a filed thing, move it to another place, day, list or category. */
export function EditFiled({ target, onClose, onSave, onRemove }: EditFiledProps) {
  const { state } = useStore()
  const today = useTodayDate()
  const [draft, setDraft] = useState<Draft | null>(null)

  const set = (changes: Partial<Draft>) => setDraft((d) => d && { ...d, ...changes })
  const tomorrow = addDays(today, 1)
  const canSave = !!draft?.title.trim() && (draft.dest !== 'list' || !!draft.listId)

  return (
    <IonModal
      className="edit-filed-modal"
      isOpen={!!target}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      onWillPresent={() => target && setDraft(draftFor(target.ref, state, today))}
      onDidDismiss={onClose}
    >
      {draft && (
        <section className="edit-filed" aria-label="Edit filed item">
          <div className="edit-filed-header">
            <h2>Fix this item</h2>
            <button
              className="edit-filed-remove"
              onClick={() => {
                onRemove()
                onClose()
              }}
            >
              Remove
            </button>
          </div>

          <label htmlFor="edit-title" className="visually-hidden">
            Item
          </label>
          <input
            id="edit-title"
            className="edit-filed-title clay-pressed"
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
