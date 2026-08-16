import { memo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyTotal } from '../../analytics/trends'
import { formatCurrency, formatMonthShort } from '../../shared/lib/format'
import './AnalyticsCharts.css'

interface MonthlyTrendChartProps {
  data: MonthlyTotal[]
}

export const MonthlyTrendChart = memo(function MonthlyTrendChart({
  data,
}: MonthlyTrendChartProps) {
  const rows = data.map((slot) => ({
    month: formatMonthShort(slot.month),
    income: slot.income,
    expenses: slot.expenses,
    savings: slot.savings,
  }))

  return (
    <div className="analytics-card">
      <h2 className="analytics-card__title">Monthly Trend</h2>
      <div className="sr-only">
        <p>Income, expenses and savings by month</p>
        <ul>
          {data.map((slot) => (
            <li key={slot.month}>
              {formatMonthShort(slot.month)}: income {formatCurrency(slot.income)}, expenses{' '}
              {formatCurrency(slot.expenses)}, savings {formatCurrency(slot.savings)}
            </li>
          ))}
        </ul>
      </div>
      <div className="analytics-chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={80}
            />
            <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#1e8e3e"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#d93025"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#4c5fd5"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Savings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})