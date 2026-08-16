import type { Category, Transaction } from '../entities/transaction/model/types'
import { getCurrentMonthKey, getLatestMonthWithData } from './budgets'
import { calculateTotalExpenses, calculateTotalIncome } from './calculations'

// Monthly aggregation layer for the Analytics screen. Unlike the flat
// calculations in calculations.ts, these shapes fill every slot of a
// fixed window, so charts never end mid-axis when a month has no data.
export interface MonthlyTotal {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CategoryMonthTotal {
  month: string
  total: number
}

export interface CategoryTrend {
  category: Category
  total: number
  byMonth: CategoryMonthTotal[]
}

function lastNMonthKeys(endMonth: string, count: number): string[] {
  const [year, month] = endMonth.split('-').map(Number)
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(year, month - 1 - i, 1)
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function calculateMonthlyTrend(
  transactions: readonly Transaction[],
  monthsBack = 6,
): MonthlyTotal[] {
  const endMonth = getLatestMonthWithData(transactions) ?? getCurrentMonthKey()
  return lastNMonthKeys(endMonth, monthsBack).map((month) => {
    const inMonth = transactions.filter((transaction) => transaction.date.startsWith(month))
    const income = calculateTotalIncome(inMonth)
    const expenses = calculateTotalExpenses(inMonth)
    return { month, income, expenses, savings: income - expenses }
  })
}

export function calculateCategoryTrend(
  transactions: readonly Transaction[],
  monthsBack = 6,
): CategoryTrend[] {
  const endMonth = getLatestMonthWithData(transactions) ?? getCurrentMonthKey()
  const months = lastNMonthKeys(endMonth, monthsBack)

  const byCategory = new Map<Category, { total: number; perMonth: Map<string, number> }>()
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue
    const month = transaction.date.slice(0, 7)
    if (!months.includes(month)) continue
    const entry = byCategory.get(transaction.category) ?? {
      total: 0,
      perMonth: new Map(),
    }
    entry.total += transaction.amount
    entry.perMonth.set(month, (entry.perMonth.get(month) ?? 0) + transaction.amount)
    byCategory.set(transaction.category, entry)
  }

  return [...byCategory.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([category, entry]) => ({
      category,
      total: entry.total,
      byMonth: months.map((month) => ({ month, total: entry.perMonth.get(month) ?? 0 })),
    }))
}