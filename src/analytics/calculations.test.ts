import { describe, expect, it } from 'vitest'
import type { Transaction } from '../entities/transaction/model/types'
import {
  calculateAverageDailySpending,
  calculateBalance,
  calculateCategoryStats,
  calculateLargestExpense,
  calculateMonthlyStats,
  calculateSavings,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
  daysElapsedInMonth,
  daysInMonth,
} from './calculations'

const fixture = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  date: '2026-08-01',
  amount: 1000,
  type: 'expense',
  category: 'food',
  description: 'Test',
  account: 'Checking Account',
  ...overrides,
})

const EMPTY: Transaction[] = []

describe('calculateTotalIncome', () => {
  it('sums only income transactions', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', amount: 100 }),
      fixture({ id: 'b', type: 'expense', amount: 40 }),
      fixture({ id: 'c', type: 'income', amount: 50 }),
    ]
    expect(calculateTotalIncome(transactions)).toBe(150)
  })

  it('returns 0 for an empty dataset', () => {
    expect(calculateTotalIncome(EMPTY)).toBe(0)
  })
})

describe('calculateTotalExpenses', () => {
  it('sums only expense transactions', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', amount: 100 }),
      fixture({ id: 'b', type: 'expense', amount: 40 }),
      fixture({ id: 'c', type: 'expense', amount: 10 }),
    ]
    expect(calculateTotalExpenses(transactions)).toBe(50)
  })

  it('returns 0 for an empty dataset', () => {
    expect(calculateTotalExpenses(EMPTY)).toBe(0)
  })
})

describe('calculateBalance and calculateSavings', () => {
  it('computes income minus expenses', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', amount: 100 }),
      fixture({ id: 'b', type: 'expense', amount: 30 }),
      fixture({ id: 'c', type: 'expense', amount: 20 }),
    ]
    expect(calculateBalance(transactions)).toBe(50)
    expect(calculateSavings(transactions)).toBe(50)
  })

  it('returns 0 for an empty dataset', () => {
    expect(calculateBalance(EMPTY)).toBe(0)
    expect(calculateSavings(EMPTY)).toBe(0)
  })
})

describe('calculateSavingsRate', () => {
  it('computes savings as a percentage of income', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', amount: 1000 }),
      fixture({ id: 'b', type: 'expense', amount: 600 }),
    ]
    expect(calculateSavingsRate(transactions)).toBe(40)
  })

  it('rounds to one decimal place', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', amount: 1000 }),
      fixture({ id: 'b', type: 'expense', amount: 333 }),
    ]
    expect(calculateSavingsRate(transactions)).toBe(66.7)
  })

  it('returns 0 instead of Infinity when there is no income', () => {
    const transactions = [fixture({ id: 'a', type: 'expense', amount: 500 })]
    expect(calculateSavingsRate(transactions)).toBe(0)
  })

  it('returns 0 for an empty dataset', () => {
    expect(calculateSavingsRate(EMPTY)).toBe(0)
  })
})

describe('calculateCategoryStats', () => {
  it('groups expenses by category with percentages', () => {
    const transactions = [
      fixture({ id: 'a', category: 'food', amount: 600 }),
      fixture({ id: 'b', category: 'food', amount: 400 }),
      fixture({ id: 'c', category: 'transport', amount: 1500 }),
      fixture({ id: 'd', type: 'income', category: 'salary', amount: 5000 }),
    ]
    const stats = calculateCategoryStats(transactions)

    expect(stats).toHaveLength(2)
    expect(stats[0]).toEqual({ category: 'transport', amount: 1500, percentage: 60 })
    expect(stats[1]).toEqual({ category: 'food', amount: 1000, percentage: 40 })
  })

  it('sorts categories by amount descending', () => {
    const transactions = [
      fixture({ id: 'a', category: 'food', amount: 100 }),
      fixture({ id: 'b', category: 'transport', amount: 500 }),
      fixture({ id: 'c', category: 'shopping', amount: 300 }),
    ]
    const categories = calculateCategoryStats(transactions).map((stat) => stat.category)
    expect(categories).toEqual(['transport', 'shopping', 'food'])
  })

  it('returns an empty list for an empty dataset', () => {
    expect(calculateCategoryStats(EMPTY)).toEqual([])
  })
})

describe('calculateMonthlyStats', () => {
  it('groups income and expenses per month', () => {
    const transactions = [
      fixture({ id: 'a', date: '2026-07-10', type: 'income', amount: 500 }),
      fixture({ id: 'b', date: '2026-07-15', type: 'expense', amount: 100 }),
      fixture({ id: 'c', date: '2026-08-02', type: 'income', amount: 700 }),
      fixture({ id: 'd', date: '2026-08-03', type: 'expense', amount: 200 }),
    ]
    expect(calculateMonthlyStats(transactions)).toEqual([
      { month: '2026-07', income: 500, expenses: 100 },
      { month: '2026-08', income: 700, expenses: 200 },
    ])
  })

  it('returns an empty list for an empty dataset', () => {
    expect(calculateMonthlyStats(EMPTY)).toEqual([])
  })
})

describe('calculateLargestExpense', () => {
  it('returns the expense with the highest amount', () => {
    const transactions = [
      fixture({ id: 'a', category: 'food', amount: 300 }),
      fixture({ id: 'b', category: 'transport', amount: 900 }),
      fixture({ id: 'c', category: 'shopping', amount: 450 }),
    ]
    const largest = calculateLargestExpense(transactions)
    expect(largest?.id).toBe('b')
  })

  it('ignores income transactions', () => {
    const transactions = [
      fixture({ id: 'a', type: 'income', category: 'salary', amount: 100000 }),
      fixture({ id: 'b', type: 'expense', category: 'food', amount: 100 }),
    ]
    const largest = calculateLargestExpense(transactions)
    expect(largest?.id).toBe('b')
  })

  it('returns null when there are no expenses', () => {
    expect(calculateLargestExpense(EMPTY)).toBeNull()
  })
})

describe('daysInMonth', () => {
  it('returns the real day count of a month', () => {
    expect(daysInMonth('2026-07')).toBe(31)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
  })

  it('returns 0 for malformed input', () => {
    expect(daysInMonth('2026-13')).toBe(0)
    expect(daysInMonth('nope')).toBe(0)
  })
})

describe('daysElapsedInMonth', () => {
  it('returns the elapsed day when the month is the current one', () => {
    expect(daysElapsedInMonth('2026-08', '2026-08-20')).toBe(20)
  })

  it('returns null for months that are not the current one', () => {
    expect(daysElapsedInMonth('2026-07', '2026-08-20')).toBeNull()
  })
})

describe('calculateAverageDailySpending', () => {
  it('divides expenses by the full month length for completed months', () => {
    const transactions = [fixture({ id: 'a', date: '2026-07-01', amount: 31000 })]
    expect(calculateAverageDailySpending(transactions, '2026-07', '2026-08-20')).toBe(1000)
  })

  it('divides by the days elapsed so far for the current month', () => {
    const transactions = [fixture({ id: 'a', date: '2026-08-01', amount: 20000 })]
    expect(calculateAverageDailySpending(transactions, '2026-08', '2026-08-20')).toBe(1000)
  })

  it('ignores income transactions', () => {
    const transactions = [fixture({ id: 'a', type: 'income', amount: 31000 })]
    expect(calculateAverageDailySpending(transactions, '2026-07', '2026-08-20')).toBe(0)
  })

  it('returns 0 when there are no expenses or no rows', () => {
    expect(calculateAverageDailySpending(EMPTY, '2026-07', '2026-08-20')).toBe(0)
    expect(calculateAverageDailySpending(EMPTY, '2026-08', '2026-08-20')).toBe(0)
  })
})
