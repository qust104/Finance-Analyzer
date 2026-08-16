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
import { CATEGORY_LABELS } from '../../entities/transaction/model/types'
import type { Category } from '../../entities/transaction/model/types'
import { CATEGORY_COLORS } from '../../shared/lib/categoryColors'
import { formatCurrency } from '../../shared/lib/format'
import './AnalyticsCharts.css'

interface CategoryBreakdownChartProps {
  data: CategoryTrend[]
}

export const CategoryBreakdownChart = memo(function CategoryBreakdownChart({
  data,
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
    name: CATEGORY_LABELS[trend.category],
    total: trend.total,
    fill: CATEGORY_COLORS[trend.category as Category],
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
            <CartesianGrid strokeDasharray="3 3" stroke="#ececf1" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#82869c' }} />
            <YAxis
              tick={{ fontSize: 12, fill: '#82869c' }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={80}
            />
            <Tooltip formatter={(value) => [formatCurrency(Number(value))]} cursor={{ fill: '#f2f3f7' }} />
            <Legend />
            <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})