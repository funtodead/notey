import { IonContent } from '@ionic/react'

import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'

export default function Mic({ onClose }: { onClose: () => void }) {
  return (
    <IonContent>
      <div className="page">
        <PageHeader
          size="medium"
          title="What’s on your mind?"
          end={<IconButton icon="close" label="Close" onClick={onClose} />}
        />
      </div>
    </IonContent>
  )
}
