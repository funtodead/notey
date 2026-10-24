import { useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { useSettings } from '../../hooks/useSettings'
import './ApiKeyRow.css'

export function ApiKeyRow() {
  const { settings, update } = useSettings()
  const [visible, setVisible] = useState(false)
  const hasKey = settings.groqKey !== ''

  return (
    <section className="api-key clay">
      <div className="api-key-header">
        <span className="api-key-icon clay-sm" aria-hidden="true">
          <Icon name="key" size={18} />
        </span>
        <label htmlFor="groq-key">Groq API key</label>
        <span className={`api-key-status ${hasKey ? 'api-key-ok' : ''}`}>
          <span aria-hidden="true" />
          {hasKey ? 'Added' : 'Not set'}
        </span>
      </div>
      <div className="api-key-field">
        <input
          id="groq-key"
          className="clay-pressed"
          type={visible ? 'text' : 'password'}
          value={settings.groqKey}
          placeholder="gsk_…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => update({ groqKey: e.target.value.trim() })}
        />
        <button aria-label={visible ? 'Hide key' : 'Show key'} onClick={() => setVisible(!visible)}>
          <Icon name="eye" size={20} />
        </button>
      </div>
      <p className="api-key-note">Stored only on this iPhone. Used to sort what you say.</p>
    </section>
  )
}
