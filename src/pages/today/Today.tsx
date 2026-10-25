import { useIonRouter } from '@ionic/react'
import { useState } from 'react'

import { EditFiled } from '../../components/items/EditFiled'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'
import { useExternalDay } from '../../hooks/useCalendars'
import { useCategories } from '../../hooks/useCategories'
import { useDay } from '../../hooks/useDay'
import { useItemActions } from '../../hooks/useItemActions'
import { useOverdue } from '../../hooks/useOverdue'
import { useTodayDate } from '../../hooks/useTodayDate'
import { formatLongDate } from '../../lib/dates'
import type { Item } from '../../types/models'
import { CalendarSection } from './CalendarSection'
import { CategorySection } from './CategorySection'
import { OverdueSection } from './OverdueSection'
import { ProgressRing } from './ProgressRing'
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
            {tasks.length > 0 && <ProgressRing done={tasks.filter((t) => t.done).length} total={tasks.length} />}
            <IconButton icon="settings" label="Settings" onClick={() => router.push('/settings')} />
          </>
        }
      />

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
    </Page>
  )
}
