import './Switch.css'

interface SwitchProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** On/off toggle: a pressed-in track with a raised knob. */
export function Switch({ checked, label, onChange, disabled }: SwitchProps) {
  return (
    <button
      className={`switch clay-pressed ${checked ? 'switch-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="clay-sm" />
    </button>
  )
}
