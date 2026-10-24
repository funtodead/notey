import { useIonViewDidEnter, useIonViewWillLeave } from '@ionic/react'
import { useEffect, useRef, useState } from 'react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { useCalendarIndex } from '../../hooks/useCalendarIndex'
import { useCategories } from '../../hooks/useCategories'
import { useTodayDate } from '../../hooks/useTodayDate'
import { monthKey } from '../../lib/calendar'
import { DaySheet } from './DaySheet'
import { MonthGrid } from './MonthGrid'
import { YearGrid } from './YearGrid'
import './Calendar.css'

type View = 'month' | 'year'

export default function Calendar() {
  const today = useTodayDate()
  const thisYear = Number(today.slice(0, 4))
  const index = useCalendarIndex(`${thisYear}-01-01`, `${thisYear + 1}-12-31`)
  const { categories } = useCategories()
  const [view, setView] = useState<View>('month')
  const [selected, setSelected] = useState(today)
  const [expanded, setExpanded] = useState(false)
  const [scrollTo, setScrollTo] = useState(() => monthKey(thisYear, Number(today.slice(5, 7)) - 1))
  const months = useRef(new Map<string, HTMLElement>())

  // This year and next, so the year view can jump to any of their months.
  const monthList = [thisYear, thisYear + 1].flatMap((year) => Array.from({ length: 12 }, (_, month) => ({ year, month })))

  const scrollToMonth = () => months.current.get(scrollTo)?.scrollIntoView({ block: 'start' })

  // Ionic's scroll area is only ready once the page is shown, so the first jump waits for that.
  const jumpedOnce = useRef(false)
  useIonViewDidEnter(() => {
    if (jumpedOnce.current) return
    jumpedOnce.current = true
    scrollToMonth()
  })

  // Jumps from the year view: wait a frame for the month grids to render.
  useEffect(() => {
    if (!jumpedOnce.current || view !== 'month') return
    const frame = requestAnimationFrame(scrollToMonth)
    return () => cancelAnimationFrame(frame)
  }, [view, scrollTo])

  useIonViewWillLeave(() => setExpanded(false))

  const pickMonth = (year: number, month: number) => {
    setScrollTo(monthKey(year, month))
    setView('month')
  }

  return (
    <Page>
      <div className="calendar-header">
        <PageHeader
          title="Calendar"
          end={
            <Segmented
              label="Calendar view"
              options={[
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' },
              ]}
              value={view}
              onChange={setView}
            />
          }
        />
      </div>

      {view === 'month' ? (
        <>
          {monthList.map(({ year, month }) => (
            <MonthGrid
              key={monthKey(year, month)}
              ref={(el) => {
                if (el) months.current.set(monthKey(year, month), el)
              }}
              year={year}
              month={month}
              index={index}
              today={today}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
          {/* Room to scroll the last weeks up from under the day panel. */}
          <div className="calendar-sheet-space" aria-hidden="true" />
          <DaySheet date={selected} expanded={expanded} onExpandedChange={setExpanded} />
        </>
      ) : (
        <>
          {[thisYear, thisYear + 1].map((year) => (
            <YearGrid key={year} year={year} index={index} today={today} onPickMonth={pickMonth} />
          ))}
          <div className="calendar-legend">
            {categories.map((c) => (
              <span key={c.id} className={`tone-${c.color}`}>
                <span aria-hidden="true" />
                {c.name}
              </span>
            ))}
          </div>
        </>
      )}
    </Page>
  )
}
