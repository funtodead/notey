import { Icon } from './Icon'
import './Checkbox.css'

interface CheckboxProps {
  checked: boolean
  /** What gets checked, for screen readers. */
  label: string
  onChange: () => void
}

/** Round clay checkbox; its fill uses the surrounding tone's --dot color. */
export function Checkbox({ checked, label, onChange }: CheckboxProps) {
  return (
    <button
      className="checkbox"
      aria-pressed={checked}
      aria-label={(checked ? 'Mark as not done: ' : 'Mark as done: ') + label}
      onClick={onChange}
    >
      <span className={`checkbox-box ${checked ? 'checkbox-checked' : ''}`}>
        {checked && <Icon name="check" size={16} strokeWidth={3.2} />}
      </span>
    </button>
  )
}
