import { CategoryChip } from '../../components/items/CategoryChip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Icon } from '../../components/ui/Icon'
import type { Category } from '../../types/models'
import './TodayEmpty.css'

const BALLS = [
  { left: 6, top: 104, size: 58 },
  { left: 160, top: 0, size: 44 },
  { left: 156, top: 116, size: 38 },
  { left: 22, top: 18, size: 26 },
]

export function TodayEmpty({ categories }: { categories: Category[] }) {
  return (
    <EmptyState
      art={
        <div className="today-empty-art">
          <div className="today-empty-sun clay">
            <Icon name="today" size={54} strokeWidth={2} />
          </div>
          {categories.slice(0, 4).map((c, i) => (
            <span
              key={c.id}
              className={`art-ball tone-${c.color}`}
              style={{ left: BALLS[i].left, top: BALLS[i].top, width: BALLS[i].size, height: BALLS[i].size }}
            />
          ))}
        </div>
      }
      title="A clear day"
      text="Nothing planned yet. Tap the mic and say something like “dentist Tuesday at 3” or “pay rent today” — Notey files it here by category."
      hint="Tap the mic to start"
    >
      <p className="empty-state-label">Your categories</p>
      <div className="today-empty-chips">
        {categories.map((c) => (
          <CategoryChip key={c.id} category={c} />
        ))}
      </div>
    </EmptyState>
  )
}
