import { useContext } from 'react'

import { ToastContext } from '../state/ToastProvider'

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
