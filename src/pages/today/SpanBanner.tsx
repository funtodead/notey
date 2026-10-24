import { useIonRouter } from '@ionic/react'

import { Icon } from '../../components/ui/Icon'
import type { SpanItem } from '../../hooks/useDay'
import { daysBetween, formatShortDate } from '../../lib/dates'
import type { Category } from '../../types/models'
import './SpanBanner.css'

interface SpanBannerProps {
  item: SpanItem
  category: Category
  today: string
}

/** A multi-day event happening today, e.g. "Trip to Eilat · day 3 of 3". */
export function SpanBanner({ item, category, today }: SpanBannerProps) {
  const router = useIonRouter()
  const length = daysBetween(item.date, item.endDate) + 1
  const day = daysBetween(item.date, today) + 1
  const range = `${formatShortDate(item.date)} – ${formatShortDate(item.endDate)}`

  return (
    <button
      className={`span-banner clay-tint tone-${category.color}`}
      aria-label={`${item.title}, ${range}, day ${day} of ${length}`}
      onClick={() => router.push('/calendar', 'none', 'replace')}
    >
      <span className="span-banner-icon">
        <Icon name="calendar" size={20} />
      </span>
      <span className="span-banner-text">
        <span className="span-banner-title">{item.title}</span>
        <span className="span-banner-meta">
          {range} · day {day} of {length}
        </span>
      </span>
      {length <= 7 && (
        <span className="span-banner-days" aria-hidden="true">
          {Array.from({ length }, (_, i) => (
            <span key={i} className={i + 1 === day ? 'span-banner-current' : undefined} />
          ))}
        </span>
      )}
    </button>
  )
}
