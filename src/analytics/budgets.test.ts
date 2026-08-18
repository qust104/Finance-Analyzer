import { describe, expect, it } from 'vitest'
import type { Budget } from '../entities/budget/model/types'
import type { Transaction } from '../entities/transaction/model/types'
import {
  calculateBudgetUsage,
  getCurrentMonthKey,
  getLatestMonthWithData,
  resolveReportMonth,
} from './budgets'

// Vitest runs in Node, so a process object exists at runtime even
// though tsconfig.app.json only lists DOM types.
declare const process: { env: Record<string, string | undefined> }

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  date: '2026-08-05',
  amount: 100,
  type: 'expense',
  category: 'food',
  description: 'Test',
  account: 'Checking Account',
  ...overrides,
})

const budget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'b1',
  category: 'food',
  amount: 1000,
  period: 'monthly',
  ...overrides,
})

describe('calculateBudgetUsage', () => {
  it('computes spent, percent and remaining for the month', () => {
    const transactions = [
      transaction({ category: 'food', amount: 300 }),
      transaction({ category: 'food', amount: 200 }),
      transaction({ category: 'food', date: '2026-07-05', amount: 900 }),
    ]
    const usage = calculateBudgetUsage(transactions, [budget()], '2026-08')[0]

    expect(usage.spent).toBe(500)
    expect(usage.usagePercent).toBe(50)
    expect(usage.remaining).toBe(500)
    expect(usage.exceeded).toBe(false)
  })

  it('marks exceeded budgets and returns a negative remaining', () => {
    const usage = calculateBudgetUsage(
      [transaction({ category: 'food', amount: 1200 })],
      [budget({ amount: 1000 })],
      '2026-08',
    )[0]

    expect(usage.usagePercent).toBe(120)
    expect(usage.exceeded).toBe(true)
    expect(usage.remaining).toBe(-200)
  })

  it('returns zero usage for categories without expenses', () => {
    const usage = calculateBudgetUsage([], [budget({ category: 'transport' })], '2026-08')[0]
    expect(usage.spent).toBe(0)
    expect(usage.usagePercent).toBe(0)
    expect(usage.exceeded).toBe(false)
  })

  it('ignores expenses from other months and income always', () => {
    const transactions = [
      transaction({ category: 'food', date: '2026-07-20', amount: 500 }),
      transaction({ category: 'food', type: 'income', amount: 1000 }),
      transaction({ category: 'food', amount: 150 }),
    ]
    const usage = calculateBudgetUsage(transactions, [budget()], '2026-08')[0]
    expect(usage.spent).toBe(150)
  })

  it('returns an empty list when there are no budgets', () => {
    expect(calculateBudgetUsage([transaction()], [], '2026-08')).toEqual([])
  })

  it('sorts budgets by usage percentage descending', () => {
    const transactions = [
      transaction({ category: 'food', amount: 800 }),
      transaction({ category: 'transport', amount: 100 }),
    ]
    const budgets = [
      budget({ id: 'a', category: 'food', amount: 1000 }),
      budget({ id: 'b', category: 'transport', amount: 1000 }),
    ]
    const usages = calculateBudgetUsage(transactions, budgets, '2026-08')
    expect(usages[0].budget.id).toBe('a')
  })
})

describe('getCurrentMonthKey', () => {
  it('returns the month of the reference date in local time', () => {
    expect(getCurrentMonthKey(new Date(2026, 7, 1))).toBe('2026-08')
    expect(getCurrentMonthKey(new Date(2026, 11, 31))).toBe('2026-12')
    expect(getCurrentMonthKey(new Date(2026, 0, 15))).toBe('2026-01')
  })

  it('defaults to the current calendar month', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getCurrentMonthKey()).toBe(currentMonth)
  })

  it('stays on the local month at month start in a UTC+X timezone', () => {
    const originalTimezone = process.env.TZ
    process.env.TZ = 'Asia/Vladivostok'
    try {
      // 00:30 local is still "yesterday" in UTC: a UTC-based slice
      // would fall back to the previous month.
      const justAfterMidnight = new Date(2026, 7, 1, 0, 30)
      expect(getCurrentMonthKey(justAfterMidnight)).toBe('2026-08')
    } finally {
      process.env.TZ = originalTimezone
    }
  })
})

describe('getLatestMonthWithData', () => {
  it('returns the most recent month present in the data', () => {
    const transactions = [
      transaction({ date: '2026-06-01' }),
      transaction({ date: '2026-08-01' }),
      transaction({ date: '2026-07-01' }),
    ]
    expect(getLatestMonthWithData(transactions)).toBe('2026-08')
  })

  it('returns null when there is no data at all', () => {
    expect(getLatestMonthWithData([])).toBeNull()
  })
})

describe('resolveReportMonth', () => {
  const referenceDate = new Date(2026, 7, 16)

  it('uses the current month when it has data', () => {
    const transactions = [transaction({ date: '2026-08-05' }), transaction({ date: '2026-07-20' })]
    expect(resolveReportMonth(transactions, referenceDate)).toEqual({
      month: '2026-08',
      isFallback: false,
      hasAnyData: true,
    })
  })

  it('falls back to the latest month with data and flags it', () => {
    const transactions = [transaction({ date: '2026-07-20' })]
    expect(resolveReportMonth(transactions, referenceDate)).toEqual({
      month: '2026-07',
      isFallback: true,
      hasAnyData: true,
    })
  })

  it('uses the current month with hasAnyData=false when there is no data', () => {
    expect(resolveReportMonth([], referenceDate)).toEqual({
      month: '2026-08',
      isFallback: false,
      hasAnyData: false,
    })
  })

  it('keeps the current month even at the UTC boundary near month start', () => {
    const originalTimezone = process.env.TZ
    process.env.TZ = 'Asia/Vladivostok'
    try {
      const boundary = new Date(2026, 7, 1, 0, 30)
      expect(resolveReportMonth([], boundary).month).toBe('2026-08')
    } finally {
      process.env.TZ = originalTimezone
    }
  })
})
