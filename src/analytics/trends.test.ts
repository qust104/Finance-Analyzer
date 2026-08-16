import { describe, expect, it } from 'vitest'
import type { Transaction } from '../entities/transaction/model/types'
import { calculateCategoryTrend, calculateMonthlyTrend } from './trends'

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  date: '2026-08-05',
  amount: 100,
  type: 'expense',
  category: 'food',
  description: 'Test',
  ...overrides,
})

describe('calculateMonthlyTrend', () => {
  it('fills every slot of the window, including months without data', () => {
    const transactions = [transaction({ date: '2026-08-10', amount: 300 })]

    const trend = calculateMonthlyTrend(transactions, 6)

    expect(trend).toHaveLength(6)
    expect(trend[0].month).toBe('2026-03')
    expect(trend[5]).toEqual({ month: '2026-08', income: 0, expenses: 300, savings: -300 })
    for (const slot of trend.slice(0, 5)) {
      expect(slot.income).toBe(0)
      expect(slot.expenses).toBe(0)
      expect(slot.savings).toBe(0)
    }
  })

  it('splits income and expenses per month', () => {
    const transactions = [
      transaction({ date: '2026-06-05', amount: 5000, type: 'income', category: 'salary' }),
      transaction({ date: '2026-06-20', amount: 800 }),
      transaction({ date: '2026-08-01', amount: 200 }),
    ]

    const trend = calculateMonthlyTrend(transactions, 6)

    expect(trend.find((slot) => slot.month === '2026-06')).toEqual({
      month: '2026-06',
      income: 5000,
      expenses: 800,
      savings: 4200,
    })
    expect(trend.find((slot) => slot.month === '2026-08')?.savings).toBe(-200)
  })

  it('anchors the window to the latest month with data, not the calendar', () => {
    const transactions = [transaction({ date: '2026-07-02' })]

    const trend = calculateMonthlyTrend(transactions, 3)

    expect(trend.map((slot) => slot.month)).toEqual(['2026-05', '2026-06', '2026-07'])
  })

  it('returns an empty-data window when there are no transactions', () => {
    const trend = calculateMonthlyTrend([], 3)

    expect(trend).toHaveLength(3)
    for (const slot of trend) {
      expect(slot.savings).toBe(0)
    }
  })
})

describe('calculateCategoryTrend', () => {
  it('groups expenses by category and month within the window', () => {
    const transactions = [
      transaction({ date: '2026-07-05', amount: 200 }),
      transaction({ date: '2026-08-01', amount: 100 }),
      transaction({ date: '2026-08-10', amount: 50, category: 'transport' }),
      transaction({ date: '2026-08-02', amount: 999, type: 'income', category: 'salary' }),
    ]

    const trend = calculateCategoryTrend(transactions, 6)

    expect(trend).toHaveLength(2)
    const food = trend.find((item) => item.category === 'food')
    expect(food?.total).toBe(300)
    expect(food?.byMonth.find((slot) => slot.month === '2026-08')?.total).toBe(100)
    expect(food?.byMonth.find((slot) => slot.month === '2026-07')?.total).toBe(200)
    expect(trend[0]?.category).toBe('food')
  })

  it('ignores expenses outside the window', () => {
    const transactions = [
      transaction({ date: '2026-04-10', amount: 999 }),
      transaction({ date: '2026-07-01', category: 'transport' }),
    ]
    const trend = calculateCategoryTrend(transactions, 3)

    expect(trend).toHaveLength(1)
    expect(trend[0]?.category).toBe('transport')
  })

  it('returns an empty list for an empty dataset', () => {
    expect(calculateCategoryTrend([], 6)).toEqual([])
  })
})