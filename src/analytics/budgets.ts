import type { Budget } from '../entities/budget/model/types'
import type { Transaction } from '../entities/transaction/model/types'

export interface BudgetUsage {
  budget: Budget
  spent: number
  usagePercent: number
  remaining: number
  exceeded: boolean
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// Budgets are monthly and evaluated against one report month:
// the most recent month present in the data, so the demo always
// has live numbers. Falls back to the current calendar month.
// Pure calendar fact: the real-world month for the person using the app.
// Local time on purpose — a budget month is a calendar month, not a UTC
// slice, and toISOString() would shift it during the first hours of a
// month start in UTC+X timezones.
export function getCurrentMonthKey(referenceDate: Date = new Date()): string {
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  return `${referenceDate.getFullYear()}-${month}`
}

// Pure data fact: the most recent month that actually has transactions.
// null (not '') means no data at all, so callers never have to guess.
export function getLatestMonthWithData(transactions: readonly Transaction[]): string | null {
  let latest: string | null = null
  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7)
    if (latest === null || month > latest) {
      latest = month
    }
  }
  return latest
}

export interface ReportMonth {
  month: string
  isFallback: boolean
  hasAnyData: boolean
}

// Single decision point "which month to report on": the current calendar
// month when it has data, otherwise the latest month with data. isFallback
// lets the UI say so out loud instead of silently shifting the report.
export function resolveReportMonth(
  transactions: readonly Transaction[],
  referenceDate: Date = new Date(),
): ReportMonth {
  const current = getCurrentMonthKey(referenceDate)
  const latestWithData = getLatestMonthWithData(transactions)

  if (latestWithData === null) {
    return { month: current, isFallback: false, hasAnyData: false }
  }
  if (latestWithData >= current) {
    return { month: current, isFallback: false, hasAnyData: true }
  }
  return { month: latestWithData, isFallback: true, hasAnyData: true }
}

export function calculateBudgetUsage(
  transactions: readonly Transaction[],
  budgets: readonly Budget[],
  month: string,
): BudgetUsage[] {
  const spentByCategory = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !transaction.date.startsWith(month)) {
      continue
    }
    spentByCategory.set(
      transaction.category,
      (spentByCategory.get(transaction.category) ?? 0) + transaction.amount,
    )
  }

  return budgets
    .map((budget) => {
      const spent = spentByCategory.get(budget.category) ?? 0
      return {
        budget,
        spent,
        usagePercent: roundTo((spent / budget.amount) * 100, 1),
        remaining: budget.amount - spent,
        exceeded: spent > budget.amount,
      }
    })
    .sort((a, b) => b.usagePercent - a.usagePercent)
}
