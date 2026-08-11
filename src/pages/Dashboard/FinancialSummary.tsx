import { memo, useMemo } from 'react'
import { formatCurrency, formatPercent } from '../../shared/lib/format'
import {
  calculateBalance,
  calculateSavings,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
} from '../../analytics/calculations'
import type { Transaction } from '../../entities/transaction/model/types'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  transactions: readonly Transaction[]
}

export const FinancialSummary = memo(function FinancialSummary({
  transactions,
}: FinancialSummaryProps) {
  const cards = useMemo(() => {
    const balance = calculateBalance(transactions)
    const income = calculateTotalIncome(transactions)
    const expenses = calculateTotalExpenses(transactions)
    const savings = calculateSavings(transactions)
    const savingsRate = calculateSavingsRate(transactions)

    return [
      { label: 'Total Balance', value: formatCurrency(balance), tone: 'neutral' },
      { label: 'Income', value: formatCurrency(income), tone: 'positive' },
      { label: 'Expenses', value: formatCurrency(expenses), tone: 'negative' },
      { label: 'Savings', value: formatCurrency(savings), tone: 'positive' },
      { label: 'Savings Rate', value: formatPercent(savingsRate), tone: 'neutral' },
    ]
  }, [transactions])

  return (
    <ul className="financial-summary">
      {cards.map((card) => (
        <li key={card.label} className={`stat-card stat-card--${card.tone}`}>
          <span className="stat-card__label">{card.label}</span>
          <span className="stat-card__value">{card.value}</span>
        </li>
      ))}
    </ul>
  )
})
