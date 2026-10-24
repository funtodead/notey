import { IonModal } from '@ionic/react'
import { useEffect, useState } from 'react'

import { useMicSession } from '../../hooks/useMicSession'
import Mic from '../../pages/mic/Mic'
import { Icon } from '../ui/Icon'

export function MicButton() {
  const [open, setOpen] = useState(false)
  const [presenting, setPresenting] = useState<HTMLElement | null>(null)
  const session = useMicSession()

  // The page behind shrinks back like a native iOS card sheet.
  useEffect(() => setPresenting(document.querySelector<HTMLElement>('ion-router-outlet')), [])

  return (
    <>
      <div className="mic-cradle" aria-hidden="true" />
      <button className="mic-button clay-accent" aria-label="Talk to Notey" onClick={() => setOpen(true)}>
        <Icon name="mic" size={32} />
      </button>
      <IonModal
        className="mic-modal"
        isOpen={open}
        presentingElement={presenting ?? undefined}
        onWillPresent={session.resume}
        onDidDismiss={() => {
          session.pause()
          setOpen(false)
        }}
      >
        <Mic session={session} onClose={() => setOpen(false)} />
      </IonModal>
    </>
  )
}
