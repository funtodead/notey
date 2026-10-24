import type { ReactNode } from 'react'

import './PageHeader.css'

interface PageHeaderProps {
  title: string
  eyebrow?: string
  /** Left of the title, e.g. a back button. */
  start?: ReactNode
  /** Right side, e.g. settings or add buttons. */
  end?: ReactNode
  size?: 'large' | 'medium'
}

export function PageHeader({ title, eyebrow, start, end, size = 'large' }: PageHeaderProps) {
  return (
    <header className="page-header">
      {start}
      <div className="page-header-text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`page-title page-title-${size}`}>{title}</h1>
      </div>
      {end}
    </header>
  )
}
