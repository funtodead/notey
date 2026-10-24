import { CategoryChip } from '../../components/items/CategoryChip'
import { Icon } from '../../components/ui/Icon'
import type { Category } from '../../types/models'
import './TodayEmpty.css'

export function TodayEmpty({ categories }: { categories: Category[] }) {
  return (
    <section className="today-empty">
      <div className="today-empty-art" aria-hidden="true">
        <div className="today-empty-sun clay">
          <Icon name="today" size={54} strokeWidth={2} />
        </div>
        {categories.slice(0, 4).map((c) => (
          <span key={c.id} className={`today-empty-ball tone-${c.color}`} />
        ))}
      </div>
      <h2>A clear day</h2>
      <p className="today-empty-text">
        Nothing planned yet. Tap the mic and say something like “dentist Tuesday at 3” or “pay rent today” — Notey
        files it here by category.
      </p>
      <p className="today-empty-label">Your categories</p>
      <div className="today-empty-chips">
        {categories.map((c) => (
          <CategoryChip key={c.id} category={c} />
        ))}
      </div>
      <div className="today-empty-hint">
        Tap the mic to start
        <Icon name="chevronDown" size={22} strokeWidth={2.4} />
      </div>
    </section>
  )
}
