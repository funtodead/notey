import { IonActionSheet, type ActionSheetButton } from '@ionic/react'
import { useMemo, useState } from 'react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState, TrySaying } from '../../components/ui/EmptyState'
import { IconButton } from '../../components/ui/IconButton'
import { useCategories } from '../../hooks/useCategories'
import { useNoteActions } from '../../hooks/useNoteActions'
import { useStore } from '../../hooks/useStore'
import { findPhone } from '../../lib/notes'
import type { Note } from '../../types/models'
import { CategoryFilter } from './CategoryFilter'
import { NoteCard } from './NoteCard'
import { NotesArt } from './NotesArt'
import { NoteSheet } from './NoteSheet'
import './Notes.css'

export default function Notes() {
  const { notes } = useStore().state
  const { categories, byId } = useCategories()
  const actions = useNoteActions()
  const [filter, setFilter] = useState<string | null>(null)
  const [query, setQuery] = useState<string | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [menuFor, setMenuFor] = useState<Note | null>(null)

  const shown = useMemo(() => {
    const q = query?.trim().toLowerCase()
    return notes
      .filter((n) => !filter || n.categoryId === filter)
      .filter((n) => !q || `${n.text} ${n.body ?? ''}`.toLowerCase().includes(q))
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [notes, filter, query])

  const menuPhone = menuFor ? findPhone(`${menuFor.text} ${menuFor.body ?? ''}`) : null
  const menuButtons: ActionSheetButton[] = [
    ...(menuPhone
      ? [
          { text: 'Call', handler: () => void (location.href = `tel:${menuPhone.tel}`) },
          { text: 'Copy number', handler: () => void actions.copy(menuPhone.display) },
          { text: 'Send message', handler: () => void (location.href = `sms:${menuPhone.tel}`) },
        ]
      : []),
    { text: 'Edit note', handler: () => setEditing(menuFor) },
    { text: 'Delete note', role: 'destructive', handler: () => void (menuFor && actions.remove(menuFor)) },
    { text: 'Cancel', role: 'cancel' },
  ]

  return (
    <Page>
      <PageHeader
        title="Notes"
        end={
          notes.length > 0 && (
            <IconButton
              icon={query === null ? 'search' : 'close'}
              label={query === null ? 'Search notes' : 'Close search'}
              onClick={() => setQuery(query === null ? '' : null)}
            />
          )
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          art={<NotesArt />}
          title="No notes yet"
          text="Ideas, phone numbers and recommendations with no date land here, newest first."
          hint="Tap the mic to add a note"
        >
          <TrySaying examples={['gift idea: photo book', 'plumber Marco 06 12 34 56 78']} />
        </EmptyState>
      ) : (
        <>
          {query !== null && (
            <input
              className="notes-search clay-pressed"
              type="search"
              placeholder="Search notes…"
              aria-label="Search notes"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <CategoryFilter categories={categories} selected={filter} onSelect={setFilter} />
          {shown.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              category={byId.get(note.categoryId)}
              onOpen={() => setEditing(note)}
              onMenu={() => setMenuFor(note)}
              onDelete={() => actions.remove(note)}
            />
          ))}
          {shown.length === 0 && <p className="notes-none">No notes match.</p>}
        </>
      )}

      <NoteSheet
        note={editing}
        onClose={() => setEditing(null)}
        onSave={(changes) => editing && actions.update(editing, changes)}
        onDelete={() => editing && actions.remove(editing)}
      />

      <IonActionSheet
        isOpen={!!menuFor}
        header={menuFor?.text}
        onDidDismiss={() => setMenuFor(null)}
        buttons={menuButtons}
      />
    </Page>
  )
}
