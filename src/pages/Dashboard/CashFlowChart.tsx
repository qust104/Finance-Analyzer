import { memo, useMemo } from 'react'
import {
  Area,
  CartesianGrid,
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

const INCOME_COLOR = '#22c55e'
const EXPENSES_COLOR = '#ef4444'

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
      <div className="cash-flow-chart__header">
        <h2 className="dashboard-card__title">Cash Flow Overview</h2>
        <div className="cash-flow-chart__legend">
          <span className="cash-flow-chart__legend-item">
            <span
              className="cash-flow-chart__legend-dot"
              style={{ background: INCOME_COLOR }}
              aria-hidden="true"
            />
            Income
          </span>
          <span className="cash-flow-chart__legend-item">
            <span
              className="cash-flow-chart__legend-dot"
              style={{ background: EXPENSES_COLOR }}
              aria-hidden="true"
            />
            Expenses
          </span>
        </div>
      </div>
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
            <defs>
              <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.25} />
                <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={80}
            />
            <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
            <Area type="monotone" dataKey="income" stroke="none" fill="url(#income-fill)" />
            <Line
              type="monotone"
              dataKey="income"
              stroke={INCOME_COLOR}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke={EXPENSES_COLOR}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})