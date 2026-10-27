import { useIonRouter } from '@ionic/react'
import { useMemo, useState } from 'react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { IconButton } from '../../components/ui/IconButton'
import { useStore } from '../../hooks/useStore'
import { useTodayDate } from '../../hooks/useTodayDate'
import { formatMediumDate, formatShortDate } from '../../lib/dates'
import { repeatLabel } from '../../lib/recurrence'
import { buildStats } from '../../lib/stats'
import './Stats.css'

/** How the last days went: tasks done per day, streaks, and where the work went. */
export default function Stats() {
  const router = useIonRouter()
  const { state } = useStore()
  const today = useTodayDate()
  const stats = useMemo(() => buildStats(state, today), [state, today])
  const [picked, setPicked] = useState(today)
  const back = () => (router.canGoBack() ? router.goBack() : router.push('/today', 'back', 'replace'))

  const done = stats.week.reduce((n, d) => n + d.done, 0)
  const total = stats.week.reduce((n, d) => n + d.total, 0)
  const max = Math.max(1, ...stats.week.map((d) => d.total))
  const day = stats.week.find((d) => d.date === picked) ?? stats.week[6]
  const topCategory = Math.max(1, ...stats.byCategory.map((c) => c.done))

  return (
    <Page>
      <div className="stats">
        <PageHeader size="medium" title="Stats" start={<IconButton icon="back" label="Back to Today" onClick={back} />} />

        <div className="stats-tiles">
          <div className="stats-tile clay">
            <span className="stats-tile-value">{done}</span>
            <span className="stats-tile-label">done this week</span>
          </div>
          <div className="stats-tile clay">
            <span className="stats-tile-value">{total ? `${Math.round((done / total) * 100)}%` : '–'}</span>
            <span className="stats-tile-label">of {total} planned</span>
          </div>
          <div className="stats-tile clay">
            <span className="stats-tile-value">{stats.streak}</span>
            <span className="stats-tile-label">{stats.streak === 1 ? 'day' : 'days'} in a row</span>
          </div>
        </div>

        <section className="stats-card clay" aria-labelledby="stats-week">
          <h2 id="stats-week" className="stats-heading">
            Tasks done, last 7 days
          </h2>
          <p className="stats-readout" aria-live="polite">
            <strong>{day.date === today ? 'Today' : formatMediumDate(day.date)}</strong> · {day.done} of {day.total}{' '}
            done
          </p>
          <div className="stats-bars">
            {stats.week.map((d) => (
              <button
                key={d.date}
                className={`stats-bar ${d.date === day.date ? 'stats-bar-picked' : ''}`}
                aria-label={`${formatMediumDate(d.date)}: ${d.done} of ${d.total} done`}
                aria-pressed={d.date === day.date}
                onClick={() => setPicked(d.date)}
              >
                <span className="stats-bar-track">
                  {/* Planned, as a faint column, with what got done filled in from the bottom. */}
                  <span className="stats-bar-planned" style={{ height: `${(d.total / max) * 100}%` }} />
                  <span className="stats-bar-done" style={{ height: `${(d.done / max) * 100}%` }} />
                </span>
                <span className="stats-bar-day">{formatShortDate(d.date).split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <p className="stats-key">
            <span className="stats-key-done" aria-hidden="true" /> Done
            <span className="stats-key-planned" aria-hidden="true" /> Planned
          </p>
        </section>

        {stats.byCategory.length > 0 && (
          <section className="stats-card clay" aria-labelledby="stats-categories">
            <h2 id="stats-categories" className="stats-heading">
              Done by category, last 30 days
            </h2>
            {stats.byCategory.map(({ category, done }) => (
              <div key={category.id} className={`stats-category tone-${category.color}`}>
                <span className="stats-category-name">{category.name}</span>
                <span className="stats-category-track">
                  <span style={{ width: `${(done / topCategory) * 100}%` }} />
                </span>
                <span className="stats-category-value">{done}</span>
              </div>
            ))}
          </section>
        )}

        {stats.habits.length > 0 && (
          <section className="stats-card clay" aria-labelledby="stats-habits">
            <h2 id="stats-habits" className="stats-heading">
              Repeating tasks
            </h2>
            {stats.habits.map(({ item, streak }) => (
              <div key={item.id} className="stats-habit">
                <span className="stats-habit-text">
                  <span>{item.title}</span>
                  <span>{repeatLabel(item)}</span>
                </span>
                <span className="stats-habit-streak">
                  {streak > 0 ? `🔥 ${streak} in a row` : 'No streak yet'}
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </Page>
  )
}
