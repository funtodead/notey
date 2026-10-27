import { IonApp, IonRouterOutlet } from '@ionic/react'
import { IonReactHashRouter } from '@ionic/react-router'
import { Navigate, Route } from 'react-router-dom'

import { TabBar } from './components/layout/TabBar'
import Calendar from './pages/calendar/Calendar'
import ListDetail from './pages/lists/ListDetail'
import Lists from './pages/lists/Lists'
import Notes from './pages/notes/Notes'
import Settings from './pages/settings/Settings'
import Stats from './pages/stats/Stats'
import Today from './pages/today/Today'
import { CalendarsProvider } from './state/CalendarsProvider'
import { NotificationSync } from './state/NotificationSync'
import { SettingsProvider } from './state/SettingsProvider'
import { StoreProvider } from './state/StoreProvider'
import { ToastProvider } from './state/ToastProvider'

export default function App() {
  return (
    <StoreProvider>
      <SettingsProvider>
        <CalendarsProvider>
          <NotificationSync />
          <IonApp>
            <ToastProvider>
              <IonReactHashRouter>
                <IonRouterOutlet>
                  <Route path="/today" element={<Today />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/lists" element={<Lists />} />
                  <Route path="/lists/:id" element={<ListDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/" element={<Navigate to="/today" replace />} />
                </IonRouterOutlet>
                <TabBar />
              </IonReactHashRouter>
            </ToastProvider>
          </IonApp>
        </CalendarsProvider>
      </SettingsProvider>
    </StoreProvider>
  )
}
