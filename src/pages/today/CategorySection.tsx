import { ItemRow } from '../../components/items/ItemRow'
import { useItemActions } from '../../hooks/useItemActions'
import type { Category, Item } from '../../types/models'
import './CategorySection.css'

interface CategorySectionProps {
  category: Category
  items: Item[]
  onOpen: (item: Item) => void
}

export function CategorySection({ category, items, onOpen }: CategorySectionProps) {
  const { toggleDone, remove } = useItemActions()
  const tasks = items.filter((i) => i.kind === 'task')

  return (
    <section className={`category-section clay-tint tone-${category.color}`} aria-label={category.name}>
      <div className="category-section-header">
        <span className="category-section-dot" aria-hidden="true" />
        <h2>{category.name}</h2>
        {tasks.length > 0 && (
          <span className="category-section-count">
            {tasks.filter((t) => t.done).length}/{tasks.length}
          </span>
        )}
      </div>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onToggle={() => toggleDone(item)}
          onDelete={() => remove(item)}
          onOpen={() => onOpen(item)}
        />
      ))}
    </section>
  )
}
