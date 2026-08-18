import { memo, useMemo } from 'react'
import { formatCurrency, formatMonthKey, formatPercent } from '../../shared/lib/format'
import { compareMonthMetric } from '../../analytics/comparison'
import { calculateBalance } from '../../analytics/calculations'
import type { Transaction } from '../../entities/transaction/model/types'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  transactions: readonly Transaction[]
  month: string
}

interface SummaryCard {
  label: string
  value: string
  tone: 'neutral' | 'positive' | 'negative'
  delta: string | null
  deltaTone: 'up' | 'down' | null
}

// Monthly cards compare the selected month against the previous one;
// Total Balance stays a lifetime number (the running balance is not
// month-scoped). Savings Rate moves in percentage points, not %.
export const FinancialSummary = memo(function FinancialSummary({
  transactions,
  month,
}: FinancialSummaryProps) {
  const cards = useMemo<SummaryCard[]>(() => {
    const balance = calculateBalance(transactions)
    const income = compareMonthMetric(transactions, month, 'income')
    const expenses = compareMonthMetric(transactions, month, 'expenses')
    const savings = compareMonthMetric(transactions, month, 'savings')
    const savingsRate = compareMonthMetric(transactions, month, 'savingsRate')

    const deltaOf = (
      comparison: { changePercent: number | null; changePoints: number | null; previous: number | null },
    ): { delta: string | null; deltaTone: 'up' | 'down' | null } => {
      if (comparison.previous === null) {
        return { delta: null, deltaTone: null }
      }
      const points = comparison.changePoints
      const percent = comparison.changePercent
      if (points === null && percent === null) {
        return { delta: null, deltaTone: null }
      }
      const text =
        points !== null
          ? `${points > 0 ? '+' : ''}${Math.abs(points).toFixed(1)} pp`
          : `${percent! > 0 ? '+' : ''}${formatPercent(Math.abs(percent!))}`
      return { delta: text, deltaTone: (points ?? percent)! > 0 ? 'up' : 'down' }
    }

    return [
      {
        label: 'Total Balance',
        value: formatCurrency(balance),
        tone: 'neutral' as const,
        delta: null,
        deltaTone: null,
      },
      {
        label: 'Income',
        value: formatCurrency(income.current),
        tone: 'positive' as const,
        ...deltaOf(income),
      },
      {
        label: 'Expenses',
        value: formatCurrency(expenses.current),
        tone: 'negative' as const,
        ...deltaOf(expenses),
      },
      {
        label: 'Savings',
        value: formatCurrency(savings.current),
        tone: 'positive' as const,
        ...deltaOf(savings),
      },
      {
        label: 'Savings Rate',
        value: formatPercent(savingsRate.current),
        tone: 'neutral' as const,
        ...deltaOf(savingsRate),
      },
    ]
  }, [transactions, month])

  return (
    <ul className="financial-summary">
      {cards.map((card) => (
        <li key={card.label} className={`stat-card stat-card--${card.tone}`}>
          <span className="stat-card__label">{card.label}</span>
          <span className="stat-card__value">{card.value}</span>
          {card.delta !== null && (
            <span
              className={`stat-card__delta stat-card__delta--${card.deltaTone}`}
              aria-label={`vs ${formatMonthKey(month)}`}
            >
              {card.delta} <span aria-hidden="true">vs prev.</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
})