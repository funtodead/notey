import type { DayInfo } from '../../hooks/useCalendarIndex'
import { weekdayIndex } from '../../lib/calendar'
import { formatLongDate, parseISODate } from '../../lib/dates'
import './DayCell.css'

interface DayCellProps {
  date: string
  info: DayInfo | undefined
  today: string
  selected: boolean
  onSelect: () => void
}

/** A day in the month grid: number, category dots, and a bar for a multi-day event. */
export function DayCell({ date, info, today, selected, onSelect }: DayCellProps) {
  const span = info?.span
  const weekday = weekdayIndex(date)
  // The bar is drawn per week row, so it also starts on Mondays and ends on Sundays.
  const segmentStart = !!span && (date === span.item.date || weekday === 0)
  const segmentEnd = !!span && (date === span.item.endDate || weekday === 6)
  const label = [formatLongDate(date), span?.item.title, date === today && 'today'].filter(Boolean).join(', ')

  return (
    <button
      className={[
        'day-cell',
        date === today && 'day-cell-today',
        selected && 'day-cell-selected',
        date < today && 'day-cell-past',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="day-cell-number">{parseISODate(date).getDate()}</span>
      <span className="day-cell-dots" aria-hidden="true">
        {info?.colors.map((color) => (
          <span key={color} className={`tone-${color}`} />
        ))}
      </span>
      <span
        className={[
          'day-cell-span',
          span && `tone-${span.color}`,
          segmentStart && 'day-cell-span-start',
          segmentEnd && 'day-cell-span-end',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {segmentStart && span.item.title}
      </span>
    </button>
  )
}
