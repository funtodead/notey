import { IonContent, IonHeader, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react'

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

export default function Home() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notey</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Notey</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="ion-padding">
          <IonText color="medium">
            <p>{today}</p>
          </IonText>
          <div className="empty-state">
            <IonText color="medium">Nothing here yet</IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
