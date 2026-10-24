import { useIonRouter } from '@ionic/react'

import { Icon, type IconName } from '../../components/ui/Icon'
import type { MicSession } from '../../hooks/useMicSession'
import type { MicError as MicErrorKind } from '../../types/mic'
import './MicError.css'

const COPY: Record<MicErrorKind, { icon: IconName; title: string; body: string }> = {
  offline: {
    icon: 'wifiOff',
    title: 'You’re offline',
    body: 'I kept your message and will file it as soon as you’re back online.',
  },
  nokey: {
    icon: 'key',
    title: 'Add your Groq API key',
    body: 'I need a key to understand you. I kept your message and will file it once a key is added.',
  },
  badkey: {
    icon: 'key',
    title: 'Your Groq key didn’t work',
    body: 'Check the key in Settings. I kept your message and will file it once it works.',
  },
  nomic: {
    icon: 'micOff',
    title: 'Notey needs microphone access',
    body: 'Allow the microphone for this site in Settings › Apps › Safari — or just type, it works the same.',
  },
  failed: {
    icon: 'alert',
    title: 'That didn’t work',
    body: 'Something went wrong while filing. Your message is kept — try again in a moment.',
  },
}

interface MicErrorProps {
  kind: MicErrorKind
  session: MicSession
  onClose: () => void
}

export function MicError({ kind, session, onClose }: MicErrorProps) {
  const router = useIonRouter()
  const { icon, title, body } = COPY[kind]

  const openSettings = () => {
    onClose()
    router.push('/settings')
  }

  return (
    <div className="mic-error" aria-live="assertive">
      <div className="mic-error-header">
        <span className="mic-error-icon" aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
        <span className="mic-error-title">{title}</span>
      </div>
      <p>{body}</p>
      <div className="mic-error-actions">
        {(kind === 'offline' || kind === 'failed') && (
          <>
            <button className="mic-pill-button mic-pill-primary" onClick={session.retry}>
              Try again
            </button>
            <button className="mic-pill-button mic-pill-secondary" onClick={session.dismissError}>
              Keep for later
            </button>
          </>
        )}
        {(kind === 'nokey' || kind === 'badkey') && (
          <>
            <button className="mic-pill-button mic-pill-primary" onClick={openSettings}>
              Open Settings
            </button>
            <button className="mic-pill-button mic-pill-secondary" onClick={session.dismissError}>
              Not now
            </button>
          </>
        )}
        {kind === 'nomic' && (
          <button
            className="mic-pill-button mic-pill-primary"
            onClick={() => {
              session.dismissError()
              document.getElementById('mic-text')?.focus()
            }}
          >
            Type instead
          </button>
        )}
      </div>
    </div>
  )
}
