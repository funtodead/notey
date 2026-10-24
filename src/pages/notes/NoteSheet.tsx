import { IonModal } from '@ionic/react'
import { useState } from 'react'

import { useCategories } from '../../hooks/useCategories'
import type { Note } from '../../types/models'
import '../../components/ui/Sheet.css'

interface NoteSheetProps {
  note: Note | null
  onClose: () => void
  onSave: (changes: Partial<Note>) => void
  onDelete: () => void
}

/** Edit a note's title, details and category. */
export function NoteSheet({ note, onClose, onSave, onDelete }: NoteSheetProps) {
  const { categories } = useCategories()
  const [draft, setDraft] = useState({ text: '', body: '', categoryId: '' })

  return (
    <IonModal
      className="sheet-modal"
      isOpen={!!note}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      onWillPresent={() => note && setDraft({ text: note.text, body: note.body ?? '', categoryId: note.categoryId })}
      onDidDismiss={onClose}
    >
      <section className="sheet" aria-label="Edit note">
        <div className="sheet-header">
          <button className="sheet-link" onClick={onClose}>
            Cancel
          </button>
          <h2>Edit note</h2>
          <button
            className="sheet-primary"
            disabled={!draft.text.trim()}
            onClick={() => {
              onSave({ text: draft.text.trim(), body: draft.body.trim() || undefined, categoryId: draft.categoryId })
              onClose()
            }}
          >
            Save
          </button>
        </div>

        <label htmlFor="note-title" className="visually-hidden">
          Title
        </label>
        <input
          id="note-title"
          className="sheet-input clay-pressed"
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        />
        <label htmlFor="note-body" className="visually-hidden">
          Details
        </label>
        <textarea
          id="note-body"
          className="sheet-input sheet-textarea clay-pressed"
          placeholder="Details, phone numbers…"
          rows={4}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />

        <fieldset className="sheet-fieldset">
          <legend>Category</legend>
          <div className="sheet-chips">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`sheet-category tone-${c.color} ${draft.categoryId === c.id ? 'sheet-category-on' : ''}`}
                aria-pressed={draft.categoryId === c.id}
                onClick={() => setDraft({ ...draft, categoryId: c.id })}
              >
                <span aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="sheet-danger"
          onClick={() => {
            onDelete()
            onClose()
          }}
        >
          Delete note
        </button>
      </section>
    </IonModal>
  )
}
