import { Icon } from '../../components/ui/Icon'
import { COLORS } from '../../lib/colors'
import type { Category } from '../../types/models'

interface CategoryRowProps {
  category: Category
  count: number
  editing: boolean
  canRemove: boolean
  onEdit: () => void
  onDone: () => void
  onChange: (changes: Partial<Category>) => void
  onRemove: () => void
}

export function CategoryRow({ category, count, editing, canRemove, onEdit, onDone, onChange, onRemove }: CategoryRowProps) {
  if (!editing) {
    return (
      <div className={`category-row tone-${category.color}`}>
        <span className="category-row-dot" aria-hidden="true" />
        <span className="category-row-name">{category.name}</span>
        <span className="category-row-count">{count === 1 ? '1 item' : `${count} items`}</span>
        <button className="category-row-edit" aria-label={`Edit ${category.name}`} onClick={onEdit}>
          <Icon name="pencil" size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className={`category-row category-row-editing tone-${category.color}`}>
      <div className="category-row-fields">
        <span className="category-row-dot" aria-hidden="true" />
        <label htmlFor={`category-${category.id}`} className="visually-hidden">
          Category name
        </label>
        <input
          id={`category-${category.id}`}
          className="clay-pressed"
          value={category.name}
          autoFocus
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={() => !category.name.trim() && onChange({ name: 'Untitled' })}
        />
        <button className="category-row-done" onClick={onDone}>
          Done
        </button>
      </div>
      <fieldset className="category-row-colors">
        <legend className="visually-hidden">Category color</legend>
        {COLORS.map((c) => (
          <button
            key={c.key}
            className={`tone-${c.key} ${category.color === c.key ? 'category-row-color-on' : ''}`}
            aria-label={c.name}
            aria-pressed={category.color === c.key}
            onClick={() => onChange({ color: c.key })}
          />
        ))}
      </fieldset>
      {canRemove && (
        <button className="category-row-remove" onClick={onRemove}>
          Remove category
        </button>
      )}
    </div>
  )
}
