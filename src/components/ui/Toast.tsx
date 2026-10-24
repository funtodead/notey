import { Icon } from './Icon'
import './Toast.css'

export interface ToastMessage {
  message: string
  onUndo?: () => void
}

export function Toast({ message, onUndo }: ToastMessage) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name="trash" size={18} />
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button className="toast-action" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  )
}
