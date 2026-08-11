import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { calculateBudgetUsage, getLatestMonthKey } from '../../analytics/budgets'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { BudgetProgress } from '../../entities/budget/ui/BudgetProgress'
import './BudgetOverview.css'

interface BudgetOverviewProps {
  transactions: readonly Transaction[]
  budgets: readonly Budget[]
}

export const BudgetOverview = memo(function BudgetOverview({
  transactions,
  budgets,
}: BudgetOverviewProps) {
  const usages = useMemo(() => {
    const month = getLatestMonthKey(transactions)
    return calculateBudgetUsage(transactions, budgets, month)
  }, [transactions, budgets])

  return (
    <div className="dashboard-card">
      <div className="budget-overview__header">
        <h2 className="dashboard-card__title">Budget Overview</h2>
        <Link to="/budgets" className="budget-overview__link">
          Manage
        </Link>
      </div>

      {usages.length === 0 ? (
        <p className="budget-overview__empty">
          No budgets set yet.{' '}
          <Link to="/budgets" className="budget-overview__link">
            Create one
          </Link>
        </p>
      ) : (
        usages.map((usage) => <BudgetProgress key={usage.budget.id} usage={usage} />)
      )}
    </div>
  )
})
