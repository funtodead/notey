import { useIonRouter } from '@ionic/react'
import { useState } from 'react'

import { EditFiled } from '../../components/items/EditFiled'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { Icon } from '../../components/ui/Icon'
import { IconButton } from '../../components/ui/IconButton'
import { useExternalDay } from '../../hooks/useCalendars'
import { useCategories } from '../../hooks/useCategories'
import { useDay } from '../../hooks/useDay'
import { useItemActions } from '../../hooks/useItemActions'
import { useOverdue } from '../../hooks/useOverdue'
import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { formatLongDate } from '../../lib/dates'
import { refile } from '../../lib/filing'
import type { Item } from '../../types/models'
import { BackupBanner } from './BackupBanner'
import { CalendarSection } from './CalendarSection'
import { CategorySection } from './CategorySection'
import { OverdueSection } from './OverdueSection'
import { ProgressRing } from './ProgressRing'
import { SearchSheet } from './SearchSheet'
import { SpanBanner } from './SpanBanner'
import { TodayEmpty } from './TodayEmpty'

export default function Today() {
  const router = useIonRouter()
  const today = useTodayDate()
  const { items, spans } = useDay(today)
  const overdue = useOverdue(today)
  const { categories, byId } = useCategories()
  const actions = useItemActions()
  const [editing, setEditing] = useState<Item | null>(null)
  /** Id for the item being added by hand. */
  const [adding, setAdding] = useState<string | null>(null)
  const { state, dispatch } = useStore()
  const [searching, setSearching] = useState(false)

  const external = useExternalDay(today)
  const tasks = items.filter((i) => i.kind === 'task')
  const isEmpty = items.length === 0 && spans.length === 0 && overdue.length === 0 && external.length === 0

  return (
    <Page>
      <PageHeader
        eyebrow={formatLongDate(today)}
        title="Today"
        end={
          <>
            {tasks.length > 0 && (
              <ProgressRing
                done={tasks.filter((t) => t.done).length}
                total={tasks.length}
                onClick={() => router.push('/stats')}
              />
            )}
            <IconButton icon="plus" label="Add something" onClick={() => setAdding(crypto.randomUUID())} />
            <IconButton icon="settings" label="Settings" onClick={() => router.push('/settings')} />
          </>
        }
      />

      <button className="search-open clay-pressed" onClick={() => setSearching(true)}>
        <Icon name="search" size={18} />
        Search everything
      </button>

      <BackupBanner />

      {spans.map((span) => {
        const category = byId.get(span.categoryId)
        return category && <SpanBanner key={span.id} item={span} category={category} today={today} />
      })}

      {overdue.length > 0 && <OverdueSection items={overdue} today={today} />}

      {external.length > 0 && <CalendarSection events={external} />}

      {categories.map((category) => {
        const own = items.filter((i) => i.categoryId === category.id)
        return (
          own.length > 0 && (
            <CategorySection key={category.id} category={category} items={own} onOpen={setEditing} />
          )
        )
      })}

      {isEmpty && <TodayEmpty categories={categories} />}

      <EditFiled
        entity={editing && { kind: 'item', id: editing.id }}
        onClose={() => setEditing(null)}
        onSave={(draft) => editing && actions.edit(editing, draft)}
        onRemove={() => editing && actions.removeAll(editing)}
      />
      <EditFiled
        entity={adding ? { kind: 'item', id: adding } : null}
        onClose={() => setAdding(null)}
        onSave={(draft) => adding && dispatch({ type: 'entities/add', bundle: refile({ kind: 'item', id: adding }, draft, state).bundle })}
      />
      <SearchSheet isOpen={searching} onClose={() => setSearching(false)} />
    </Page>
  )
}
