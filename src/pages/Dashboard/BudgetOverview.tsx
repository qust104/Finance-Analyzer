import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { calculateBudgetUsage } from '../../analytics/budgets'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { BudgetProgress } from '../../entities/budget/ui/BudgetProgress'
import { useReportMonth } from '../../shared/hooks/useReportMonth'
import { ReportMonthBanner } from '../../shared/ui/ReportMonthBanner'
import './BudgetOverview.css'

interface BudgetOverviewProps {
  transactions: readonly Transaction[]
  budgets: readonly Budget[]
}

export const BudgetOverview = memo(function BudgetOverview({
  transactions,
  budgets,
}: BudgetOverviewProps) {
  const { month, isFallback } = useReportMonth(transactions)
  const usages = useMemo(
    () => calculateBudgetUsage(transactions, budgets, month),
    [transactions, budgets, month],
  )

  return (
    <div className="dashboard-card">
      <div className="budget-overview__header">
        <h2 className="dashboard-card__title">Budget Overview</h2>
        <Link to="/budgets" className="budget-overview__link">
          Manage
        </Link>
      </div>

      {isFallback && <ReportMonthBanner month={month} />}

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
