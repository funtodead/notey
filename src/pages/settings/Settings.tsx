import { useIonRouter } from '@ionic/react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'
import { ApiKeyRow } from './ApiKeyRow'
import { AppearanceRow } from './AppearanceRow'
import { BackupRow } from './BackupRow'
import { CategoriesEditor } from './CategoriesEditor'
import { IntegrationsRow } from './IntegrationsRow'
import './Settings.css'

export default function Settings() {
  const router = useIonRouter()
  const back = () => (router.canGoBack() ? router.goBack() : router.push('/today', 'back', 'replace'))

  return (
    <Page>
      <div className="settings">
        <PageHeader size="medium" title="Settings" start={<IconButton icon="back" label="Back to Today" onClick={back} />} />
        <ApiKeyRow />
        <AppearanceRow />
        <IntegrationsRow />
        <CategoriesEditor />
        <BackupRow />
      </div>
    </Page>
  )
}
