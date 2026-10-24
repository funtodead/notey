import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupIonicReact } from '@ionic/react'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

import '@fontsource/fredoka/600.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'

import './theme/tokens.css'
import './theme/clay.css'
import './theme/global.css'

import App from './App'
import { requestPersistentStorage } from './lib/storage'

// Always use iOS behavior (transitions, gestures), even when previewing on a desktop browser.
setupIonicReact({ mode: 'ios' })
requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
