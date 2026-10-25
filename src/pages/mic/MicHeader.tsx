import { IconButton } from '../../components/ui/IconButton'
import type { MicSession } from '../../hooks/useMicSession'
import type { MicError } from '../../types/mic'
import { resultLabel } from './FiledResult'
import './MicHeader.css'

const ERROR_STATUS: Record<MicError, string> = {
  offline: 'Offline',
  nokey: 'No API key',
  badkey: 'Key not working',
  nomic: 'Microphone off',
  failed: 'Something went wrong',
}

function status({ phase, error, messages }: MicSession): { label: string; tone: 'ok' | 'busy' | 'err' } {
  if (phase === 'recording') return { label: 'Listening', tone: 'busy' }
  if (phase === 'thinking') return { label: 'Thinking', tone: 'busy' }
  if (phase === 'error' && error) return { label: ERROR_STATUS[error], tone: 'err' }
  const last = messages.at(-1)
  if (phase === 'filed' && last?.role === 'ai') {
    const filed = last.refs.filter((r) => r.kind !== 'list').length
    return { label: resultLabel(filed, last.changed.length, last.removed.length), tone: 'ok' }
  }
  return { label: 'Ready', tone: 'ok' }
}

export function MicHeader({ session, onClose }: { session: MicSession; onClose: () => void }) {
  const { label, tone } = status(session)

  return (
    <header className="mic-header">
      <IconButton icon="close" label="Close" onClick={onClose} />
      <div className="mic-header-title">
        <span>Notey</span>
        <output className={`mic-status mic-status-${tone}`}>
          <span aria-hidden="true" />
          {label}
        </output>
      </div>
      <span className="mic-header-spacer" aria-hidden="true" />
    </header>
  )
}
