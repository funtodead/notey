import './Segmented.css'

interface SegmentedProps<T extends string> {
  label: string
  options: { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** A pressed-in track with the chosen option raised, e.g. Month | Year. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented clay-pressed" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          className={o.id === value ? 'clay-sm' : undefined}
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
