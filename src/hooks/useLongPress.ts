import { useRef, type MouseEvent, type PointerEvent } from 'react'

const HOLD_MS = 500
const MOVE_TOLERANCE = 10

/**
 * Press-and-hold handlers. iOS Safari never fires contextmenu on a long press, so this times
 * the press itself, cancels on scroll, and swallows the click that follows a long press.
 */
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number>(undefined)
  const start = useRef({ x: 0, y: 0 })
  const fired = useRef(false)

  const cancel = () => clearTimeout(timer.current)

  return {
    onPointerDown: (e: PointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        onLongPress()
      }, HOLD_MS)
    },
    onPointerMove: (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClickCapture: (e: MouseEvent) => {
      if (!fired.current) return
      e.preventDefault()
      e.stopPropagation()
    },
  }
}
