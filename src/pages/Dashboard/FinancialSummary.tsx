import { memo, useMemo } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Info,
  Percent,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { formatCurrency, formatMonthKey, formatPercent } from '../../shared/lib/format'
import { compareAverageDailySpending, compareMonthMetric } from '../../analytics/comparison'
import { calculateBalance, localDateKey } from '../../analytics/calculations'
import type { Transaction } from '../../entities/transaction/model/types'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  transactions: readonly Transaction[]
  month: string
  today?: string
}

// Delta tone follows the metric's semantics, not the arithmetic sign:
// a falling expense number is good, so it gets the green tone, while
// a rising expense is bad and turns red. The arrow keeps the sign.
interface SummaryCard {
  label: string
  value: string
  tone: 'neutral' | 'positive' | 'negative'
  icon: LucideIcon
  iconTone: 'blue' | 'green' | 'red' | 'purple' | 'orange'
  delta: string | null
  deltaTone: 'good' | 'bad' | null
  noDataLabel?: string
  hint?: string
}

// Monthly cards compare the selected month against the previous one;
// Total Balance stays a lifetime number (the running balance is not
// month-scoped). Savings Rate moves in percentage points, not %.
export const FinancialSummary = memo(function FinancialSummary({
  transactions,
  month,
  today = localDateKey(),
}: FinancialSummaryProps) {
  const cards = useMemo<SummaryCard[]>(() => {
    const balance = calculateBalance(transactions)
    const income = compareMonthMetric(transactions, month, 'income')
    const expenses = compareMonthMetric(transactions, month, 'expenses')
    const savings = compareMonthMetric(transactions, month, 'savings')
    const savingsRate = compareMonthMetric(transactions, month, 'savingsRate')
    const dailySpending = compareAverageDailySpending(transactions, month, today)

    const deltaOf = (
      comparison: { changePercent: number | null; changePoints: number | null; previous: number | null },
      // When true, an increase is a good thing for the user.
      upIsGood: boolean,
    ): { delta: string | null; deltaTone: 'good' | 'bad' | null } => {
      if (comparison.previous === null) {
        return { delta: null, deltaTone: null }
      }
      const points = comparison.changePoints
      const percent = comparison.changePercent
      if (points === null && percent === null) {
        return { delta: null, deltaTone: null }
      }
      const change = points ?? percent!
      const arrow = change > 0 ? '\u2191' : change < 0 ? '\u2193' : ''
      const magnitude =
        points !== null
          ? `${Math.abs(points).toFixed(1)} pp`
          : formatPercent(Math.abs(percent!))
      const good = upIsGood ? change > 0 : change < 0
      return { delta: `${arrow} ${magnitude}`, deltaTone: change === 0 ? null : good ? 'good' : 'bad' }
    }

    return [
      {
        label: 'Total Balance',
        value: formatCurrency(balance),
        tone: 'neutral' as const,
        icon: Wallet,
        iconTone: 'blue' as const,
        delta: null,
        deltaTone: null,
      },
      {
        label: 'Income',
        value: formatCurrency(income.current),
        tone: 'positive' as const,
        icon: ArrowDown,
        iconTone: 'green' as const,
        ...deltaOf(income, true),
      },
      {
        label: 'Expenses',
        value: formatCurrency(expenses.current),
        tone: 'negative' as const,
        icon: ArrowUp,
        iconTone: 'red' as const,
        ...deltaOf(expenses, false),
      },
      {
        label: 'Savings',
        value: formatCurrency(savings.current),
        tone: 'positive' as const,
        icon: PiggyBank,
        iconTone: 'green' as const,
        ...deltaOf(savings, true),
      },
      {
        label: 'Savings Rate',
        value: formatPercent(savingsRate.current),
        tone: 'neutral' as const,
        icon: Percent,
        iconTone: 'purple' as const,
        ...deltaOf(savingsRate, true),
      },
      {
        label: 'Average Daily Spending',
        value: formatCurrency(dailySpending.current),
        tone: 'neutral' as const,
        icon: CalendarDays,
        iconTone: 'orange' as const,
        ...deltaOf(dailySpending, false),
        noDataLabel: '\u2014',
        hint: 'Average amount spent per day during the selected month. For an unfinished month, the days elapsed so far are used.',
      },
    ]
  }, [transactions, month, today])

  return (
    <ul className="financial-summary">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <li key={card.label} className={`stat-card stat-card--${card.tone}`}>
            <span className={`stat-card__icon stat-card__icon--${card.iconTone}`} aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="stat-card__label">
              {card.label}
              {card.hint !== undefined && (
                <span className="stat-card__hint" title={card.hint}>
                  <Info size={13} aria-hidden="true" />
                  <span className="sr-only">{card.hint}</span>
                </span>
              )}
            </span>
            <span className="stat-card__value">{card.value}</span>
            {card.delta !== null ? (
              <span
                className={`stat-card__delta stat-card__delta--${card.deltaTone}`}
                aria-label={`vs ${formatMonthKey(month)}`}
              >
                {card.delta} <span aria-hidden="true">vs prev.</span>
              </span>
            ) : card.noDataLabel !== undefined ? (
              <span
                className="stat-card__delta stat-card__delta--none"
                aria-label={`vs ${formatMonthKey(month)}`}
              >
                {card.noDataLabel} <span aria-hidden="true">vs prev.</span>
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
})