import type { Ref } from 'react'

import type { DayInfo } from '../../hooks/useCalendarIndex'
import { monthCells, monthName, WEEKDAY_LETTERS } from '../../lib/calendar'
import { DayCell } from './DayCell'
import './MonthGrid.css'

interface MonthGridProps {
  year: number
  month: number
  index: Map<string, DayInfo>
  today: string
  selected: string
  onSelect: (date: string) => void
  ref?: Ref<HTMLElement>
}

export function MonthGrid({ year, month, index, today, selected, onSelect, ref }: MonthGridProps) {
  return (
    <section ref={ref} className="month-grid" aria-label={`${monthName(year, month)} ${year}`}>
      <h2>
        {monthName(year, month)} <span>{year}</span>
      </h2>
      <div className="month-grid-weekdays" aria-hidden="true">
        {WEEKDAY_LETTERS.map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      <div className="month-grid-days">
        {monthCells(year, month).map((date, i) =>
          date ? (
            <DayCell
              key={date}
              date={date}
              info={index.get(date)}
              today={today}
              selected={date === selected}
              onSelect={() => onSelect(date)}
            />
          ) : (
            <span key={`blank-${i}`} />
          ),
        )}
      </div>
    </section>
  )
}
