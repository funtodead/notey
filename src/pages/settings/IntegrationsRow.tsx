import { Icon } from '../../components/ui/Icon'
import './IntegrationsRow.css'

/** Apple Calendar linking, shown as coming later. */
export function IntegrationsRow() {
  return (
    <div className="settings-group">
      <h2 className="settings-heading">Integrations</h2>
      <section className="integration clay">
        <span className="integration-icon tone-blue" aria-hidden="true">
          <Icon name="calendar" size={18} />
        </span>
        <div className="integration-text">
          <span>Apple Calendar</span>
          <span>Link your calendars · coming later</span>
        </div>
        <button
          className="integration-toggle clay-pressed"
          disabled
          aria-pressed={false}
          aria-label="Link Apple Calendar, not available yet"
        >
          <span className="clay-sm" />
        </button>
      </section>
    </div>
  )
}
