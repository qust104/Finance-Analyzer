import { Car, Gamepad2, Home, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { BudgetUsage } from '../../../analytics/budgets'
import { categoryColorOf, categoryLabelOf } from '../../category/model/catalog'
import type { CategoryDef } from '../../category/model/types'
import { formatCurrency } from '../../../shared/lib/format'
import './BudgetProgress.css'
import '../../../shared/ui/form.css'

interface BudgetProgressProps {
  usage: BudgetUsage
  categories: readonly CategoryDef[]
  onEdit?: (usage: BudgetUsage) => void
  onDelete?: (id: string) => void
}

// Branded category glyphs: a small icon in a tinted square per category
// group; groups without a glyph fall back to the category color dot.
const CATEGORY_GLYPHS: Record<string, { icon: LucideIcon; tone: string }> = {
  housing: { icon: Home, tone: 'blue' },
  food: { icon: UtensilsCrossed, tone: 'orange' },
  transport: { icon: Car, tone: 'cyan' },
  entertainment: { icon: Gamepad2, tone: 'pink' },
}

export function BudgetProgress({ usage, categories, onEdit, onDelete }: BudgetProgressProps) {
  const { budget, spent, usagePercent, remaining, exceeded } = usage
  const barWidth = usagePercent > 100 ? 100 : usagePercent
  // Bar color follows usage: green while comfortably under, orange
  // approaching the ceiling, red at or beyond it.
  const stateClass =
    usagePercent > 95 ? '--exceeded' : usagePercent >= 75 ? '--warning' : '--ok'
  const glyph = CATEGORY_GLYPHS[budget.category]
  const GlyphIcon = glyph?.icon

  return (
    <article className="budget-progress">
      <div className="budget-progress__header">
        <span className="budget-progress__category">
          {GlyphIcon ? (
            <span
              className={`budget-progress__glyph budget-progress__glyph--${glyph.tone}`}
              aria-hidden="true"
            >
              <GlyphIcon size={16} />
            </span>
          ) : (
            <span
              className="budget-progress__dot"
              style={{ background: categoryColorOf(categories, budget.category) }}
            />
          )}
          {categoryLabelOf(categories, budget.category)}
        </span>
        <span className="budget-progress__percent">{usagePercent.toFixed(1)}%</span>
      </div>

      <div
        className="budget-progress__track"
        role="progressbar"
        aria-valuenow={usagePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`budget-progress__bar budget-progress__bar${stateClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="budget-progress__amounts">
        <span>
          {formatCurrency(spent)} / {formatCurrency(budget.amount)}
        </span>
        {exceeded ? (
          <span className="budget-progress__status budget-progress__status--exceeded">
            Over budget by {formatCurrency(-remaining)}
          </span>
        ) : (
          <span className="budget-progress__status">{formatCurrency(remaining)} left</span>
        )}
      </div>

      {onEdit && onDelete && (
        <div className="budget-progress__actions">
          <button type="button" className="action-button" onClick={() => onEdit(usage)}>
            Edit
          </button>
          <button
            type="button"
            className="action-button action-button--danger"
            onClick={() => onDelete(budget.id)}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}