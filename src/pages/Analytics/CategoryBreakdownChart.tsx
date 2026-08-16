import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoryTrend } from '../../analytics/trends'
import { categoryColorOf, categoryLabelOf } from '../../entities/category/model/catalog'
import type { CategoryDef } from '../../entities/category/model/types'
import { formatCurrency } from '../../shared/lib/format'
import './AnalyticsCharts.css'

interface CategoryBreakdownChartProps {
  data: CategoryTrend[]
  categories: readonly CategoryDef[]
}

export const CategoryBreakdownChart = memo(function CategoryBreakdownChart({
  data,
  categories,
}: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="analytics-card">
        <h2 className="analytics-card__title">Spending by Category</h2>
        <p className="analytics-card__empty">No expenses yet.</p>
      </div>
    )
  }

  const rows = data.map((trend) => ({
    name: categoryLabelOf(categories, trend.category),
    total: trend.total,
    fill: categoryColorOf(categories, trend.category),
  }))

  return (
    <div className="analytics-card">
      <h2 className="analytics-card__title">Spending by Category</h2>
      <div className="sr-only">
        <p>Total spending per category over the period</p>
        <ul>
          {rows.map((row) => (
            <li key={row.name}>
              {row.name}: {formatCurrency(row.total)}
            </li>
          ))}
        </ul>
      </div>
      <div className="analytics-chart">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={80}
            />
            <Tooltip formatter={(value) => [formatCurrency(Number(value))]} cursor={{ fill: 'var(--surface-hover)' }} />
            <Legend />
            <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})