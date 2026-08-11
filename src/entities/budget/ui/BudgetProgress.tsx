import type { BudgetUsage } from '../../../analytics/budgets'
import { CATEGORY_LABELS } from '../../transaction/model/types'
import { CATEGORY_COLORS } from '../../../shared/lib/categoryColors'
import { formatCurrency } from '../../../shared/lib/format'
import './BudgetProgress.css'
import '../../../shared/ui/form.css'

interface BudgetProgressProps {
  usage: BudgetUsage
  onEdit?: (usage: BudgetUsage) => void
  onDelete?: (id: string) => void
}

export function BudgetProgress({ usage, onEdit, onDelete }: BudgetProgressProps) {
  const { budget, spent, usagePercent, remaining, exceeded } = usage
  const barWidth = usagePercent > 100 ? 100 : usagePercent
  const stateClass = exceeded ? '--exceeded' : usagePercent > 90 ? '--warning' : '--ok'

  return (
    <article className="budget-progress">
      <div className="budget-progress__header">
        <span className="budget-progress__category">
          <span
            className="budget-progress__dot"
            style={{ background: CATEGORY_COLORS[budget.category] }}
          />
          {CATEGORY_LABELS[budget.category]}
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
