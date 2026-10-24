import { IonContent, IonPage } from '@ionic/react'
import type { ReactNode } from 'react'

import './Page.css'

/** A screen: Ionic page + scroll area, padded for the notch and the tab bar. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="page">{children}</div>
      </IonContent>
    </IonPage>
  )
}
