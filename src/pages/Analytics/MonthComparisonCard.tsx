import { memo } from 'react'
import type { MonthlyTotal } from '../../analytics/trends'
import { formatCurrency, formatMonthKey, formatPercent } from '../../shared/lib/format'
import './AnalyticsCharts.css'

interface MonthComparisonCardProps {
  trend: MonthlyTotal[]
}

// The last two months side by side: the numbers the page exists for,
// visible without having to read a chart.
export const MonthComparisonCard = memo(function MonthComparisonCard({
  trend,
}: MonthComparisonCardProps) {
  const current = trend.at(-1)
  const previous = trend.at(-2)
  if (!current || !previous) return null

  const savingsDelta =
    previous.savings !== 0 ? (current.savings - previous.savings) / Math.abs(previous.savings) : null

  const rows: { label: string; current: string; previous: string }[] = [
    { label: 'Income', current: formatCurrency(current.income), previous: formatCurrency(previous.income) },
    { label: 'Expenses', current: formatCurrency(current.expenses), previous: formatCurrency(previous.expenses) },
    { label: 'Savings', current: formatCurrency(current.savings), previous: formatCurrency(previous.savings) },
  ]

  return (
    <div className="analytics-card">
      <h2 className="analytics-card__title">Month Comparison</h2>
      <div className="month-comparison">
        <table className="month-comparison__table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">{formatMonthKey(current.month)}</th>
              <th scope="col">{formatMonthKey(previous.month)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.current}</td>
                <td>{row.previous}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="month-comparison__delta">
          Savings{' '}
          {savingsDelta === null
            ? 'changed from a zero base'
            : `${savingsDelta >= 0 ? '+' : ''}${formatPercent(savingsDelta * 100)}`}
        </p>
      </div>
    </div>
  )
})