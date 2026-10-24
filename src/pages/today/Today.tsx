import { useIonRouter } from '@ionic/react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'
import { useCategories } from '../../hooks/useCategories'
import { useDay } from '../../hooks/useDay'
import { useOverdue } from '../../hooks/useOverdue'
import { useTodayDate } from '../../hooks/useTodayDate'
import { formatLongDate } from '../../lib/dates'
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

  const tasks = items.filter((i) => i.kind === 'task')
  const isEmpty = items.length === 0 && spans.length === 0 && overdue.length === 0

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

      {categories.map((category) => {
        const own = items.filter((i) => i.categoryId === category.id)
        return own.length > 0 && <CategorySection key={category.id} category={category} items={own} />
      })}

      {isEmpty && <TodayEmpty categories={categories} />}
    </Page>
  )
}
