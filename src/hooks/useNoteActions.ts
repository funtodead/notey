import type { Note } from '../types/models'
import { useStore } from './useStore'
import { useToast } from './useToast'

export function useNoteActions() {
  const { dispatch } = useStore()
  const showToast = useToast()

  return {
    update: (note: Note, changes: Partial<Note>) => dispatch({ type: 'notes/update', id: note.id, changes }),

    remove: (note: Note) => {
      dispatch({ type: 'entities/remove', refs: [{ kind: 'note', id: note.id }] })
      showToast({
        message: `Deleted “${note.text}”`,
        onUndo: () => dispatch({ type: 'entities/add', bundle: { notes: [note] } }),
      })
    },

    copy: async (text: string) => {
      await navigator.clipboard.writeText(text)
      showToast({ message: 'Number copied', icon: 'check' })
    },
  }
}
