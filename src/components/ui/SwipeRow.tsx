import { createGesture } from '@ionic/react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import { Icon } from './Icon'
import './SwipeRow.css'

const OPEN_X = -92

interface SwipeRowProps {
  /** What gets deleted, for screen readers. */
  label: string
  onDelete: () => void
  /** e.g. to set --swipe-radius to match the row's corners. */
  className?: string
  children: ReactNode
}

/** Swipe left to reveal a Delete button. Tapping the row while open closes it. */
export function SwipeRow({ label, onDelete, className, children }: SwipeRowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = contentRef.current!
    const startX = open ? OPEN_X : 0
    const gesture = createGesture({
      el,
      gestureName: 'swipe-row',
      direction: 'x',
      threshold: 10,
      onStart: () => {
        el.style.transition = 'none'
      },
      onMove: ({ deltaX }) => {
        const x = Math.min(0, Math.max(OPEN_X * 1.4, startX + deltaX))
        el.style.transform = `translateX(${x}px)`
      },
      onEnd: ({ deltaX }) => {
        el.style.transition = ''
        el.style.transform = ''
        setOpen(startX + deltaX < OPEN_X / 2)
      },
    })
    gesture.enable()
    return () => gesture.destroy()
  }, [open])

  const closeOnTap = (e: MouseEvent) => {
    if (!open) return
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
  }

  return (
    <div className={`swipe-row ${className ?? ''}`}>
      <button className="swipe-delete" aria-label={`Delete ${label}`} tabIndex={open ? 0 : -1} onClick={onDelete}>
        <Icon name="trash" size={18} />
        Delete
      </button>
      <div ref={contentRef} className={`swipe-content ${open ? 'swipe-open' : ''}`} onClickCapture={closeOnTap}>
        {children}
      </div>
    </div>
  )
}
