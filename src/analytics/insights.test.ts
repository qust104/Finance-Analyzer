import { describe, expect, it } from 'vitest'
import type { Budget } from '../entities/budget/model/types'
import type { Transaction } from '../entities/transaction/model/types'
import { generateInsights } from './insights'

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

const MONTH = '2026-08'

describe('generateInsights', () => {
  it('warns when a category grows more than 20% month over month', () => {
    const transactions = [
      transaction({ date: '2026-07-05', category: 'food', amount: 1000 }),
      transaction({ date: '2026-08-05', category: 'food', amount: 1500 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    const insight = insights.find((item) => item.id === 'growth-food')

    expect(insight).toBeDefined()
    expect(insight?.type).toBe('warning')
    expect(insight?.description).toContain('increased by 50%')
  })

  it('does not warn when growth is below 20%', () => {
    const transactions = [
      transaction({ date: '2026-07-05', category: 'food', amount: 1000 }),
      transaction({ date: '2026-08-05', category: 'food', amount: 1100 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    expect(insights.find((item) => item.id === 'growth-food')).toBeUndefined()
  })

  it('does not warn when a category shrank', () => {
    const transactions = [
      transaction({ date: '2026-07-05', category: 'food', amount: 1000 }),
      transaction({ date: '2026-08-05', category: 'food', amount: 500 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    expect(insights.find((item) => item.id === 'growth-food')).toBeUndefined()
  })

  it('warns when a budget is exceeded with the overspent amount', () => {
    const transactions = [transaction({ category: 'food', amount: 1400 })]
    const insights = generateInsights(transactions, [budget({ amount: 1000 })], MONTH)
    const insight = insights.find((item) => item.id === 'budget-food')

    expect(insight).toBeDefined()
    expect(insight?.type).toBe('warning')
    expect(insight?.description).toContain('by 400 ₽')
  })

  it('does not warn for a budget within limits', () => {
    const transactions = [transaction({ category: 'food', amount: 800 })]
    const insights = generateInsights(transactions, [budget({ amount: 1000 })], MONTH)
    expect(insights.find((item) => item.id === 'budget-food')).toBeUndefined()
  })

  it('highlights a savings rate above 30%', () => {
    const transactions = [
      transaction({ date: '2026-08-01', type: 'income', category: 'salary', amount: 10000 }),
      transaction({ date: '2026-08-02', type: 'expense', category: 'food', amount: 4000 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    const insight = insights.find((item) => item.id === 'savings-rate')

    expect(insight).toBeDefined()
    expect(insight?.type).toBe('positive')
    expect(insight?.description).toContain('60%')
  })

  it('does not highlight a savings rate of 20%', () => {
    const transactions = [
      transaction({ date: '2026-08-01', type: 'income', category: 'salary', amount: 10000 }),
      transaction({ date: '2026-08-02', type: 'expense', category: 'food', amount: 8000 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    expect(insights.find((item) => item.id === 'savings-rate')).toBeUndefined()
  })

  it('flags a category that dominates more than 40% of expenses', () => {
    const transactions = [
      transaction({ category: 'food', amount: 460 }),
      transaction({ category: 'transport', amount: 300 }),
      transaction({ category: 'shopping', amount: 240 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    const insight = insights.find((item) => item.id === 'dominant-food')

    expect(insight).toBeDefined()
    expect(insight?.type).toBe('info')
    expect(insight?.description).toContain('46%')
  })

  it('does not flag a category below 40%', () => {
    const transactions = [
      transaction({ category: 'food', amount: 300 }),
      transaction({ category: 'transport', amount: 300 }),
      transaction({ category: 'shopping', amount: 400 }),
    ]
    const insights = generateInsights(transactions, [], MONTH)
    expect(insights.find((item) => item.id === 'dominant-food')).toBeUndefined()
  })

  it('returns an empty list for an empty dataset', () => {
    const insights = generateInsights([], [], MONTH)
    expect(insights).toEqual([])
  })

  it('sorts warnings before other insights and limits the list', () => {
    const week1 = transaction({
      date: '2026-07-05',
      type: 'income',
      category: 'salary',
      amount: 10000,
    })
    const income = transaction({
      date: '2026-08-01',
      type: 'income',
      category: 'salary',
      amount: 15000,
    })
    const foodJuly = transaction({ date: '2026-07-05', category: 'food', amount: 1000 })
    const foodAugust = transaction({ date: '2026-08-05', category: 'food', amount: 2000 })
    const transport = transaction({ date: '2026-08-06', category: 'transport', amount: 500 })

    const insights = generateInsights(
      [week1, income, foodJuly, foodAugust, transport],
      [budget({ category: 'food', amount: 1000 })],
      MONTH,
    )

    expect(insights[0]?.type).toBe('warning')
    expect(insights.length).toBeLessThanOrEqual(5)
  })
})
