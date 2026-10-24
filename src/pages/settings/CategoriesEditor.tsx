import { useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryActions } from '../../hooks/useCategoryActions'
import { useStore } from '../../hooks/useStore'
import { CategoryRow } from './CategoryRow'
import './CategoriesEditor.css'

/** Rename, recolor, add and remove categories. One row is edited at a time. */
export function CategoriesEditor() {
  const { categories } = useCategories()
  const { items, notes } = useStore().state
  const actions = useCategoryActions()
  const [editingId, setEditingId] = useState<string | null>(null)

  const countFor = (id: string) =>
    items.filter((i) => i.categoryId === id).length + notes.filter((n) => n.categoryId === id).length

  return (
    <div className="settings-group">
      <h2 className="settings-heading">Categories</h2>
      <section className="categories clay">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            count={countFor(category.id)}
            editing={editingId === category.id}
            // Things filed under a category would lose their home, so only empty ones can go.
            canRemove={countFor(category.id) === 0 && categories.length > 1}
            onEdit={() => setEditingId(category.id)}
            onDone={() => setEditingId(null)}
            onChange={(changes) => actions.update(category, changes)}
            onRemove={() => actions.remove(category)}
          />
        ))}
        <button className="categories-add clay-sm" onClick={() => setEditingId(actions.add().id)}>
          <Icon name="plus" size={18} strokeWidth={2.6} />
          Add category
        </button>
      </section>
    </div>
  )
}
