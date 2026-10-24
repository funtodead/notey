import type { DayInfo } from '../../hooks/useCalendarIndex'
import { monthCells, monthName } from '../../lib/calendar'
import { parseISODate } from '../../lib/dates'
import './YearGrid.css'

interface YearGridProps {
  year: number
  index: Map<string, DayInfo>
  today: string
  onPickMonth: (year: number, month: number) => void
}

/** Twelve mini months; days with something on them are filled with their color. */
export function YearGrid({ year, index, today, onPickMonth }: YearGridProps) {
  const [thisYear, thisMonth] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]

  return (
    <section className="year-grid" aria-label={String(year)}>
      <h2>{year}</h2>
      <div className="year-grid-months">
        {Array.from({ length: 12 }, (_, month) => {
          const current = year === thisYear && month === thisMonth
          const past = year < thisYear || (year === thisYear && month < thisMonth)
          const cells = monthCells(year, month)
          const busy = cells.filter((d) => d && index.has(d)).length
          return (
            <button
              key={month}
              className={`year-month clay-sm ${current ? 'year-month-current' : ''} ${past ? 'year-month-past' : ''}`}
              aria-label={`${monthName(year, month)} ${year}, ${busy} days with items${current ? ', current month' : ''}`}
              onClick={() => onPickMonth(year, month)}
            >
              <span className="year-month-name">{monthName(year, month, 'short')}</span>
              <span className="year-month-days" aria-hidden="true">
                {cells.map((date, i) => {
                  if (!date) return <span key={i} />
                  const info = index.get(date)
                  const color = info?.colors[0] ?? info?.span?.color
                  return (
                    <span
                      key={date}
                      className={[
                        date === today && 'year-day-today',
                        color && `year-day-busy tone-${color}`,
                        date < today && 'year-day-past',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {parseISODate(date).getDate()}
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
