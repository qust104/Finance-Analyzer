import { memo, useMemo } from 'react'
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
import { calculateMonthlyStats } from '../../analytics/calculations'
import type { Transaction } from '../../entities/transaction/model/types'
import { formatCurrency, formatMonthShort } from '../../shared/lib/format'
import './CashFlowChart.css'

interface CashFlowChartProps {
  transactions: readonly Transaction[]
}

export const CashFlowChart = memo(function CashFlowChart({
  transactions,
}: CashFlowChartProps) {
  const data = useMemo(
    () =>
      calculateMonthlyStats(transactions).map((stat) => ({
        month: formatMonthShort(stat.month),
        income: stat.income,
        expenses: stat.expenses,
      })),
    [transactions],
  )

  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card__title">Cash Flow Overview</h2>
      <div className="sr-only">
        <p>Cash flow by month</p>
        <ul>
          {data.map((item) => (
            <li key={item.month}>
              {item.month}: income {formatCurrency(item.income)}, expenses{' '}
              {formatCurrency(item.expenses)}
            </li>
          ))}
        </ul>
      </div>
      <div className="cash-flow-chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ececf1" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#82869c' }} />
            <YAxis
              tick={{ fontSize: 12, fill: '#82869c' }}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
