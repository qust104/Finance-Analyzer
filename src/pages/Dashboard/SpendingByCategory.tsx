import { memo, useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateCategoryStats } from '../../analytics/calculations'
import { CATEGORY_LABELS } from '../../entities/transaction/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { CATEGORY_COLORS } from '../../shared/lib/categoryColors'
import { formatCurrency, formatPercent } from '../../shared/lib/format'
import './SpendingByCategory.css'

interface SpendingByCategoryProps {
  transactions: readonly Transaction[]
}

export const SpendingByCategory = memo(function SpendingByCategory({
  transactions,
}: SpendingByCategoryProps) {
  const data = useMemo(() => {
    const stats = calculateCategoryStats(transactions)
    return stats.map((stat) => ({
      name: CATEGORY_LABELS[stat.category],
      value: stat.amount,
      percentage: stat.percentage,
      fill: CATEGORY_COLORS[stat.category],
    }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="dashboard-card">
        <h2 className="dashboard-card__title">Spending by Category</h2>
        <p className="spending-empty">No expenses yet.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card__title">Spending by Category</h2>
      <div className="sr-only">
        <p>Spending by category</p>
        <ul>
          {data.map((entry) => (
            <li key={entry.name}>
              {entry.name}: {formatCurrency(entry.value)} ({formatPercent(entry.percentage)})
            </li>
          ))}
        </ul>
      </div>
      <div className="spending-by-category">
        <div className="spending-by-category__chart">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="spending-legend">
          {data.map((entry) => (
            <li key={entry.name} className="spending-legend__item">
              <span className="spending-legend__dot" style={{ background: entry.fill }} />
              <span className="spending-legend__name">{entry.name}</span>
              <span className="spending-legend__amount">{formatCurrency(entry.value)}</span>
              <span className="spending-legend__percent">{formatPercent(entry.percentage)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})
