import { createGesture } from '@ionic/react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import { Icon } from './Icon'
import './SwipeRow.css'

const OPEN_X = 92

interface SwipeRowProps {
  /** What gets deleted, for screen readers. */
  label: string
  onDelete: () => void
  /** Swiping right reveals a "+1 day" button when given. */
  onPostpone?: () => void
  /** e.g. to set --swipe-radius to match the row's corners. */
  className?: string
  children: ReactNode
}

/** Swipe left to reveal Delete (and right for +1 day). Tapping the row while open closes it. */
export function SwipeRow({ label, onDelete, onPostpone, className, children }: SwipeRowProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  /** -1: Delete showing, 1: +1 day showing. */
  const [open, setOpen] = useState<-1 | 0 | 1>(0)
  const canPostpone = !!onPostpone

  useEffect(() => {
    const el = contentRef.current!
    const startX = open * OPEN_X
    const maxX = canPostpone ? OPEN_X * 1.4 : 0
    const gesture = createGesture({
      el,
      gestureName: 'swipe-row',
      direction: 'x',
      threshold: 10,
      onStart: () => {
        el.style.transition = 'none'
      },
      onMove: ({ deltaX }) => {
        const x = Math.min(maxX, Math.max(-OPEN_X * 1.4, startX + deltaX))
        el.style.transform = `translateX(${x}px)`
      },
      onEnd: ({ deltaX }) => {
        el.style.transition = ''
        el.style.transform = ''
        const x = startX + deltaX
        setOpen(x < -OPEN_X / 2 ? -1 : canPostpone && x > OPEN_X / 2 ? 1 : 0)
      },
    })
    gesture.enable()
    return () => gesture.destroy()
  }, [open, canPostpone])

  const closeOnTap = (e: MouseEvent) => {
    if (!open) return
    e.preventDefault()
    e.stopPropagation()
    setOpen(0)
  }

  return (
    <div className={`swipe-row ${className ?? ''}`}>
      {onPostpone && (
        <button
          className="swipe-action swipe-postpone"
          aria-label={`Move ${label} a day later`}
          tabIndex={open === 1 ? 0 : -1}
          onClick={() => {
            setOpen(0)
            onPostpone()
          }}
        >
          <Icon name="arrowRight" size={18} />
          +1 day
        </button>
      )}
      <button
        className="swipe-action swipe-delete"
        aria-label={`Delete ${label}`}
        tabIndex={open === -1 ? 0 : -1}
        onClick={onDelete}
      >
        <Icon name="trash" size={18} />
        Delete
      </button>
      <div
        ref={contentRef}
        className={`swipe-content ${open === -1 ? 'swipe-open' : open === 1 ? 'swipe-open-right' : ''}`}
        onClickCapture={closeOnTap}
      >
        {children}
      </div>
    </div>
  )
}
