import { IonModal } from '@ionic/react'
import { useState } from 'react'

import type { ColorKey, List } from '../../types/models'
import '../../components/ui/Sheet.css'
import './ListSheet.css'

const COLORS: { key: ColorKey; name: string }[] = [
  { key: 'coral', name: 'Peach' },
  { key: 'blue', name: 'Sky' },
  { key: 'green', name: 'Mint' },
  { key: 'amber', name: 'Lemon' },
  { key: 'lavender', name: 'Lilac' },
  { key: 'rose', name: 'Rose' },
  { key: 'aqua', name: 'Aqua' },
  { key: 'sand', name: 'Sand' },
]

const EMOJIS = ['🎁', '🛒', '🧳', '📚', '📦', '💼', '🍳', '🏋️', '🎬', '🌱', '🎵', '🐶', '✈️', '🏠', '💡', '🎨', '🧾', '⭐']

type ListFields = Pick<List, 'name' | 'emoji' | 'color'>

interface ListSheetProps {
  open: boolean
  /** The list being edited; none means creating a new one. */
  list?: List
  onClose: () => void
  onSave: (fields: ListFields) => void
}

/** New list / Edit list: name, color and emoji. */
export function ListSheet({ open, list, onClose, onSave }: ListSheetProps) {
  const [draft, setDraft] = useState<ListFields>({ name: '', emoji: '🎁', color: 'rose' })

  return (
    <IonModal
      className="sheet-modal"
      isOpen={open}
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      onWillPresent={() => setDraft(list ? { name: list.name, emoji: list.emoji, color: list.color } : { name: '', emoji: '🎁', color: 'rose' })}
      onDidDismiss={onClose}
    >
      <section className="sheet" aria-label={list ? 'Edit list' : 'New list'}>
        <div className="sheet-header">
          <button className="sheet-link" onClick={onClose}>
            Cancel
          </button>
          <h2>{list ? 'Edit list' : 'New list'}</h2>
          <button
            className="sheet-primary"
            disabled={!draft.name.trim()}
            onClick={() => {
              onSave({ ...draft, name: draft.name.trim() })
              onClose()
            }}
          >
            {list ? 'Save' : 'Create'}
          </button>
        </div>

        <div className="list-sheet-name">
          <span className={`list-sheet-preview clay-tint tone-${draft.color}`} aria-hidden="true">
            {draft.emoji}
          </span>
          <label htmlFor="list-name" className="visually-hidden">
            List name
          </label>
          <input
            id="list-name"
            className="sheet-input clay-pressed"
            placeholder="List name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        <fieldset className="sheet-fieldset">
          <legend>Color</legend>
          <div className="list-sheet-colors">
            {COLORS.map((c) => (
              <button
                key={c.key}
                className={`tone-${c.key} ${draft.color === c.key ? 'list-sheet-color-on' : ''}`}
                aria-label={c.name}
                aria-pressed={draft.color === c.key}
                onClick={() => setDraft({ ...draft, color: c.key })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="sheet-fieldset">
          <legend>Emoji</legend>
          <div className="list-sheet-emojis">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className={draft.emoji === emoji ? 'list-sheet-emoji-on' : 'clay-sm'}
                aria-pressed={draft.emoji === emoji}
                onClick={() => setDraft({ ...draft, emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>

        {!list && (
          <p className="list-sheet-note">
            When Notey creates a list for you, it picks a color and emoji. Change them anytime.
          </p>
        )}
      </section>
    </IonModal>
  )
}
