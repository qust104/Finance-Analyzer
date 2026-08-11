import type { Category, Transaction } from '../entities/transaction/model/types'

// All analytics functions are pure: same input, same output,
// no access to React, storage or the network.

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function calculateTotalIncome(transactions: readonly Transaction[]): number {
  return transactions.reduce(
    (sum, transaction) => (transaction.type === 'income' ? sum + transaction.amount : sum),
    0,
  )
}

export function calculateTotalExpenses(transactions: readonly Transaction[]): number {
  return transactions.reduce(
    (sum, transaction) => (transaction.type === 'expense' ? sum + transaction.amount : sum),
    0,
  )
}

export function calculateBalance(transactions: readonly Transaction[]): number {
  return calculateTotalIncome(transactions) - calculateTotalExpenses(transactions)
}

export function calculateSavings(transactions: readonly Transaction[]): number {
  return calculateBalance(transactions)
}

export function calculateSavingsRate(transactions: readonly Transaction[]): number {
  const income = calculateTotalIncome(transactions)
  const savings = calculateSavings(transactions)
  if (income <= 0) {
    return 0
  }
  return roundTo((savings / income) * 100, 1)
}

export interface CategoryStat {
  category: Category
  amount: number
  percentage: number
}

export function calculateCategoryStats(transactions: readonly Transaction[]): CategoryStat[] {
  const totals = new Map<Category, number>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue
    }
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount)
  }

  const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0)

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? roundTo((amount / total) * 100, 1) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthlyStat {
  month: string
  income: number
  expenses: number
}

export function calculateMonthlyStats(transactions: readonly Transaction[]): MonthlyStat[] {
  const byMonth = new Map<string, { income: number; expenses: number }>()

  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7)
    const current = byMonth.get(month) ?? { income: 0, expenses: 0 }
    if (transaction.type === 'income') {
      current.income += transaction.amount
    } else {
      current.expenses += transaction.amount
    }
    byMonth.set(month, current)
  }

  return [...byMonth.entries()]
    .map(([month, { income, expenses }]) => ({ month, income, expenses }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function calculateAverageDailySpending(
  transactions: readonly Transaction[],
  month: string,
): number {
  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.date.startsWith(month))
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  if (expenses === 0) {
    return 0
  }

  const [year, monthIndex] = month.split('-').map(Number)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 1 ||
    monthIndex > 12
  ) {
    return 0
  }

  const daysInMonth = new Date(year, monthIndex, 0).getDate()
  return roundTo(expenses / daysInMonth, 2)
}

export function calculateLargestExpense(transactions: readonly Transaction[]): Transaction | null {
  let largest: Transaction | null = null

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue
    }
    if (largest === null || transaction.amount > largest.amount) {
      largest = transaction
    }
  }

  return largest
}
