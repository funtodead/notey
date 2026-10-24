import { useIonRouter } from '@ionic/react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'
import { formatLongDate } from '../../lib/dates'

export default function Today() {
  const router = useIonRouter()

  return (
    <Page>
      <PageHeader
        eyebrow={formatLongDate(new Date())}
        title="Today"
        end={<IconButton icon="settings" label="Settings" onClick={() => router.push('/settings')} />}
      />
    </Page>
  )
}
