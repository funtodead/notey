import { Segmented } from '../../components/ui/Segmented'
import { useSettings } from '../../hooks/useSettings'
import type { Appearance } from '../../types/models'

export function AppearanceRow() {
  const { settings, update } = useSettings()

  return (
    <div className="settings-group">
      <h2 className="settings-heading">Appearance</h2>
      <Segmented<Appearance>
        label="Appearance"
        options={[
          { id: 'dark', label: 'Dark' },
          { id: 'light', label: 'Light' },
          { id: 'system', label: 'Auto' },
        ]}
        value={settings.appearance ?? 'dark'}
        onChange={(appearance) => update({ appearance })}
      />
      <p className="settings-footnote">Auto follows your iPhone’s light or dark mode.</p>
    </div>
  )
}
