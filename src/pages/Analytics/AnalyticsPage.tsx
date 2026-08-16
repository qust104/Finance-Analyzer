import { useMemo } from 'react'
import { calculateCategoryTrend, calculateMonthlyTrend } from '../../analytics/trends'
import { calculateTotalExpenses, calculateTotalIncome } from '../../analytics/calculations'
import { formatCurrency } from '../../shared/lib/format'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { MonthComparisonCard } from './MonthComparisonCard'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import './AnalyticsPage.css'

export function AnalyticsPage() {
  const { transactions, isPending, isError, refetch } = useTransactions()

  const trend = useMemo(() => calculateMonthlyTrend(transactions), [transactions])
  const categoryTrend = useMemo(() => calculateCategoryTrend(transactions), [transactions])

  if (isPending) {
    return (
      <section>
        <h1 className="page-title">Analytics</h1>
        <LoadingState />
      </section>
    )
  }

  if (isError && transactions.length === 0) {
    return (
      <section>
        <h1 className="page-title">Analytics</h1>
        <ErrorState onRetry={refetch} />
      </section>
    )
  }

  if (transactions.length === 0) {
    return (
      <section>
        <h1 className="page-title">Analytics</h1>
        <div className="analytics-card">
          <p className="analytics-card__empty">
            Add transactions to see trends, category breakdowns and month-over-month comparisons.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 className="page-title">Analytics</h1>

      <div className="analytics-summary">
        <div className="analytics-summary__item">
          <span className="analytics-summary__label">Total income</span>
          <span className="analytics-summary__value analytics-summary__value--income">
            {formatCurrency(calculateTotalIncome(transactions))}
          </span>
        </div>
        <div className="analytics-summary__item">
          <span className="analytics-summary__label">Total expenses</span>
          <span className="analytics-summary__value analytics-summary__value--expenses">
            {formatCurrency(calculateTotalExpenses(transactions))}
          </span>
        </div>
        <div className="analytics-summary__item">
          <span className="analytics-summary__label">Last month savings</span>
          <span className="analytics-summary__value">{formatCurrency(trend.at(-1)?.savings ?? 0)}</span>
        </div>
      </div>

      <MonthlyTrendChart data={trend} />
      <CategoryBreakdownChart data={categoryTrend} />
      <MonthComparisonCard trend={trend} />
    </section>
  )
}