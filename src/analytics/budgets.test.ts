import { describe, expect, it } from 'vitest'
import type { Budget } from '../entities/budget/model/types'
import type { Transaction } from '../entities/transaction/model/types'
import { calculateBudgetUsage, getLatestMonthKey } from './budgets'

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  date: '2026-08-05',
  amount: 100,
  type: 'expense',
  category: 'food',
  description: 'Test',
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

describe('getLatestMonthKey', () => {
  it('returns the most recent month present in the data', () => {
    const transactions = [
      transaction({ date: '2026-06-01' }),
      transaction({ date: '2026-08-01' }),
      transaction({ date: '2026-07-01' }),
    ]
    expect(getLatestMonthKey(transactions)).toBe('2026-08')
  })

  it('falls back to the current month for an empty dataset', () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    expect(getLatestMonthKey([])).toBe(currentMonth)
  })
})
