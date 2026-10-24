import { Icon, type IconName } from './Icon'
import './Toast.css'

export interface ToastMessage {
  message: string
  icon?: IconName
  onUndo?: () => void
}

export function Toast({ message, icon = 'trash', onUndo }: ToastMessage) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name={icon} size={18} />
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button className="toast-action" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  )
}
