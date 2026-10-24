import { IonModal } from '@ionic/react'
import { useState } from 'react'

import Mic from '../../pages/mic/Mic'
import { Icon } from '../ui/Icon'

export function MicButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="mic-cradle" aria-hidden="true" />
      <button className="mic-button clay-accent" aria-label="Talk to Notey" onClick={() => setOpen(true)}>
        <Icon name="mic" size={32} />
      </button>
      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <Mic onClose={() => setOpen(false)} />
      </IonModal>
    </>
  )
}
