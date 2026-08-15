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
// toISOString() is UTC: in timezones ahead of it the fallback could
// land on the previous month during the first hours of month start.
function currentMonthKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function getLatestMonthKey(transactions: readonly Transaction[]): string {
  let latest = ''
  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7)
    if (month > latest) {
      latest = month
    }
  }
  return latest !== '' ? latest : currentMonthKey()
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
