import type { ReactNode } from 'react'

import { Icon } from './Icon'
import './EmptyState.css'

interface EmptyStateProps {
  /** Clay illustration above the title. */
  art: ReactNode
  title: string
  text: string
  /** Shown above the tab bar, pointing down at the mic. */
  hint: string
  children?: ReactNode
}

export function EmptyState({ art, title, text, hint, children }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-state-art" aria-hidden="true">
        {art}
      </div>
      <h2>{title}</h2>
      <p className="empty-state-text">{text}</p>
      {children}
      <div className="empty-state-hint">
        {hint}
        <Icon name="chevronDown" size={22} strokeWidth={2.4} />
      </div>
    </section>
  )
}

/** "Try saying" with example phrases. */
export function TrySaying({ examples }: { examples: string[] }) {
  return (
    <>
      <p className="empty-state-label">Try saying</p>
      <div className="empty-state-examples">
        {examples.map((example) => (
          <span key={example} className="clay-sm">
            “{example}”
          </span>
        ))}
      </div>
    </>
  )
}
