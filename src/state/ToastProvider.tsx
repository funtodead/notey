import { createContext, useCallback, useRef, useState, type ReactNode } from 'react'

import { Toast, type ToastMessage } from '../components/ui/Toast'

const DURATION_MS = 5000

export const ToastContext = createContext<((toast: ToastMessage) => void) | null>(null)

/** One toast at a time at the bottom of the screen, e.g. "Deleted X · Undo". */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const timer = useRef<number>(undefined)

  const show = useCallback((next: ToastMessage) => {
    setToast(next)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), DURATION_MS)
  }, [])

  const undo = () => {
    toast?.onUndo?.()
    setToast(null)
  }

  return (
    <ToastContext value={show}>
      {children}
      {toast && <Toast message={toast.message} onUndo={toast.onUndo && undo} />}
    </ToastContext>
  )
}
