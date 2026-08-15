import { memo, useMemo } from 'react'
import { generateInsights } from '../../analytics/insights'
import type { Insight } from '../../analytics/insights'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { useReportMonth } from '../../shared/hooks/useReportMonth'
import { ReportMonthBanner } from '../../shared/ui/ReportMonthBanner'
import './FinancialInsights.css'

interface FinancialInsightsProps {
  transactions: readonly Transaction[]
  budgets: readonly Budget[]
}

const INSIGHT_ICONS: Record<Insight['type'], string> = {
  warning: '\u0021',
  positive: '\u2713',
  info: 'i',
}

export const FinancialInsights = memo(function FinancialInsights({
  transactions,
  budgets,
}: FinancialInsightsProps) {
  const { month, isFallback } = useReportMonth(transactions)
  const insights = useMemo(
    () => generateInsights(transactions, budgets, month),
    [transactions, budgets, month],
  )

  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card__title">Financial Insights</h2>
      {isFallback && <ReportMonthBanner month={month} />}
      {insights.length === 0 ? (
        <p className="insights-empty">All quiet — nothing needs your attention right now.</p>
      ) : (
        <ul className="insights">
          {insights.map((insight) => (
            <li key={insight.id} className={`insight insight--${insight.type}`}>
              <span className={`insight__icon insight__icon--${insight.type}`} aria-hidden="true">
                {INSIGHT_ICONS[insight.type]}
              </span>
              <div className="insight__body">
                <p className="insight__title">{insight.title}</p>
                <p className="insight__description">{insight.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
