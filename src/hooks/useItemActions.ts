import { useIonActionSheet } from '@ionic/react'

import { addDays, daysBetween, todayISO } from '../lib/dates'
import { refile, type Draft } from '../lib/filing'
import type { Item } from '../types/models'
import { useStore } from './useStore'
import { useToast } from './useToast'

/**
 * Actions on dated items. A repeating item arrives here as one day's occurrence
 * (its `date` is that day); changes to the series go to the stored original.
 */
export function useItemActions() {
  const { state, dispatch } = useStore()
  const showToast = useToast()
  const [presentActionSheet] = useIonActionSheet()

  const original = (item: Item) => state.items.find((i) => i.id === item.id) ?? item

  /** Applies changes to a stored item, with an Undo that puts it back as it was. */
  const changeWithUndo = (item: Item, changes: Partial<Item>, message: string) => {
    dispatch({ type: 'items/update', id: item.id, changes })
    // Merging the old item back wouldn't clear a skip list it never had, so reset that explicitly.
    showToast({
      message,
      onUndo: () =>
        dispatch({ type: 'items/update', id: item.id, changes: { ...item, skipDates: item.skipDates ?? [] } }),
    })
  }

  /** Deletes the whole item (every occurrence, for a repeating one). */
  const removeAll = (item: Item) => {
    const stored = original(item)
    dispatch({ type: 'items/remove', id: stored.id })
    showToast({
      message: `Deleted “${stored.title}”`,
      onUndo: () => dispatch({ type: 'items/add', items: [stored] }),
    })
  }

  return {
    toggleDone: (item: Item) => {
      if (!item.repeat) return dispatch({ type: 'items/update', id: item.id, changes: { done: !item.done } })
      const doneDates = original(item).doneDates ?? []
      dispatch({
        type: 'items/update',
        id: item.id,
        changes: {
          doneDates: doneDates.includes(item.date)
            ? doneDates.filter((d) => d !== item.date)
            : [...doneDates, item.date],
        },
      })
    },

    moveTo: (item: Item, date: string) => dispatch({ type: 'items/update', id: item.id, changes: { date } }),

    /** Swipe right: a day later (tomorrow, for something overdue), keeping a multi-day event's length. */
    postpone: (item: Item) => {
      const today = todayISO()
      const date = addDays(item.date < today ? today : item.date, 1)
      const changes: Partial<Item> = { date }
      if (item.endDate) changes.endDate = addDays(item.endDate, daysBetween(item.date, date))
      changeWithUndo(item, changes, `Moved “${item.title}” to ${date === addDays(today, 1) ? 'tomorrow' : 'the next day'}`)
    },

    /** Swipe-to-delete: a repeating item asks whether to delete just that day or the rest of the series. */
    remove: (item: Item) => {
      if (!item.repeat) return removeAll(item)
      const stored = original(item)
      void presentActionSheet({
        header: `“${item.title}” repeats`,
        buttons: [
          {
            text: 'Delete only this one',
            role: 'destructive',
            handler: () =>
              changeWithUndo(stored, { skipDates: [...(stored.skipDates ?? []), item.date] }, `Deleted “${item.title}” for this day`),
          },
          {
            text: 'Delete this and all future',
            role: 'destructive',
            handler: () =>
              item.date <= stored.date
                ? removeAll(stored)
                : changeWithUndo(
                    stored,
                    { repeat: { ...stored.repeat!, until: addDays(item.date, -1) } },
                    `Ended “${item.title}”`,
                  ),
          },
          { text: 'Cancel', role: 'cancel' },
        ],
      })
    },

    removeAll,

    /** Saves the "Fix this item" sheet. */
    edit: (item: Item, draft: Draft) => {
      const { bundle } = refile({ kind: 'item', id: item.id }, draft, state)
      dispatch({ type: 'entities/remove', refs: [{ kind: 'item', id: item.id }] })
      dispatch({ type: 'entities/add', bundle })
    },
  }
}
