import type { Budget } from '../entities/budget/model/types'
import type { Category, Transaction } from '../entities/transaction/model/types'
import { CATEGORY_LABELS } from '../entities/transaction/model/types'
import { calculateBudgetUsage } from './budgets'
import {
  calculateCategoryStats,
  calculateSavingsRate,
  calculateTotalExpenses,
} from './calculations'

export type InsightType = 'positive' | 'warning' | 'info'

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  priority: number
}

// Insights are derived data: recalculated on every render from
// transactions and budgets, never persisted. Ids are deterministic
// so React keys stay stable without a random source.
export function generateInsights(
  transactions: readonly Transaction[],
  budgets: readonly Budget[],
  month: string,
): Insight[] {
  const insights: Insight[] = []

  const monthExpenses = transactions.filter(
    (transaction) => transaction.type === 'expense' && transaction.date.startsWith(month),
  )
  const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(month))

  // Rule 1: a category whose expenses grew more than 20% vs last month.
  for (const { category, current, previous } of categoryMonthSpending(transactions, month)) {
    if (previous <= 0 || current <= previous) {
      continue
    }
    const growth = ((current - previous) / previous) * 100
    if (growth > 20) {
      insights.push({
        id: `growth-${category}`,
        type: 'warning',
        title: `${CATEGORY_LABELS[category]} spending rising`,
        description: `${CATEGORY_LABELS[category]} expenses increased by ${Math.round(growth)}% month over month.`,
        priority: 2,
      })
    }
  }

  // Rule 2: a budget that was exceeded.
  for (const usage of calculateBudgetUsage(transactions, budgets, month)) {
    if (usage.exceeded) {
      insights.push({
        id: `budget-${usage.budget.category}`,
        type: 'warning',
        title: `${CATEGORY_LABELS[usage.budget.category]} budget exceeded`,
        description: `You exceeded your ${CATEGORY_LABELS[usage.budget.category]} budget by ${Math.round(-usage.remaining)} ₽.`,
        priority: 3,
      })
    }
  }

  // Rule 3: savings rate above 30% is worth highlighting.
  const savingsRate = calculateSavingsRate(monthTransactions)
  if (savingsRate > 30) {
    insights.push({
      id: 'savings-rate',
      type: 'positive',
      title: 'Healthy savings rate',
      description: `Your savings rate is ${savingsRate}%.`,
      priority: 1,
    })
  }

  // Rule 4: a category dominating more than 40% of expenses.
  const totalExpenses = calculateTotalExpenses(monthExpenses)
  const largest = calculateCategoryStats(monthExpenses)[0]
  if (largest && totalExpenses > 0 && largest.percentage > 40) {
    insights.push({
      id: `dominant-${largest.category}`,
      type: 'info',
      title: `${CATEGORY_LABELS[largest.category]} dominates spending`,
      description: `${CATEGORY_LABELS[largest.category]} accounts for ${largest.percentage}% of your expenses.`,
      priority: 1,
    })
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5)
}

function getPreviousMonthKey(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(year, monthIndex - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function categoryMonthSpending(
  transactions: readonly Transaction[],
  month: string,
): { category: Category; current: number; previous: number }[] {
  const previousMonth = getPreviousMonthKey(month)
  const totals = new Map<Category, { current: number; previous: number }>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue
    }
    const entry = totals.get(transaction.category) ?? { current: 0, previous: 0 }
    if (transaction.date.startsWith(month)) {
      entry.current += transaction.amount
    } else if (transaction.date.startsWith(previousMonth)) {
      entry.previous += transaction.amount
    }
    totals.set(transaction.category, entry)
  }

  return [...totals.entries()].map(([category, values]) => ({ category, ...values }))
}
