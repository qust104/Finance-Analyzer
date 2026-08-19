import { memo, useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateCategoryStats } from '../../analytics/calculations'
import { categoryColorOf, categoryLabelOf } from '../../entities/category/model/catalog'
import type { CategoryDef } from '../../entities/category/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { formatCurrency, formatPercent } from '../../shared/lib/format'
import './SpendingByCategory.css'

interface SpendingByCategoryProps {
  transactions: readonly Transaction[]
  categories: readonly CategoryDef[]
  month: string
}

export const SpendingByCategory = memo(function SpendingByCategory({
  transactions,
  categories,
  month,
}: SpendingByCategoryProps) {
  const data = useMemo(() => {
    const monthRows = transactions.filter((transaction) => transaction.date.startsWith(month))
    const stats = calculateCategoryStats(monthRows)
    return stats.map((stat) => ({
      name: categoryLabelOf(categories, stat.category),
      value: stat.amount,
      percentage: stat.percentage,
      fill: categoryColorOf(categories, stat.category),
    }))
  }, [transactions, categories, month])

  const total = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data])

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
          <div className="spending-by-category__center" aria-hidden="true">
            <span className="spending-by-category__center-label">Total</span>
            <span className="spending-by-category__center-value">{formatCurrency(total)}</span>
          </div>
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
