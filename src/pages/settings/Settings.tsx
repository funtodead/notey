import { useIonRouter } from '@ionic/react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'

export default function Settings() {
  const router = useIonRouter()
  const back = () => (router.canGoBack() ? router.goBack() : router.push('/today', 'back', 'replace'))

  return (
    <Page>
      <PageHeader size="medium" title="Settings" start={<IconButton icon="back" label="Back to Today" onClick={back} />} />
    </Page>
  )
}
