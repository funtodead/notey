import type { Category } from '../../types/models'
import './CategoryFilter.css'

interface CategoryFilterProps {
  categories: Category[]
  /** null = All */
  selected: string | null
  onSelect: (categoryId: string | null) => void
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="category-filter" role="group" aria-label="Filter by category">
      <button
        className={selected === null ? 'category-filter-on' : 'clay-sm'}
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          className={`tone-${c.color} ${selected === c.id ? 'category-filter-on' : 'clay-sm'}`}
          aria-pressed={selected === c.id}
          onClick={() => onSelect(c.id)}
        >
          <span aria-hidden="true" />
          {c.name}
        </button>
      ))}
    </div>
  )
}
