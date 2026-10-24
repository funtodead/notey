import type { Category } from '../../types/models'
import './CategoryChip.css'

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span className={`category-chip tone-${category.color}`}>
      <span className="category-chip-dot" aria-hidden="true" />
      {category.name}
    </span>
  )
}
