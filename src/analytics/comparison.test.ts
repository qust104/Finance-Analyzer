import { describe, expect, it } from 'vitest'
import { compareMonthMetric, previousMonthKey } from './comparison'

const transaction = (
  month: string,
  type: 'income' | 'expense',
  amount: number,
  day = '15',
) => ({
  id: `${month}-${type}-${amount}`,
  date: `${month}-${day}`,
  type,
  amount,
  category: 'salary',
  description: 'test',
  account: 'Checking Account',
})

describe('previousMonthKey', () => {
  it('shifts to the previous calendar month', () => {
    expect(previousMonthKey('2026-08')).toBe('2026-07')
  })

  it('wraps January to December of the previous year', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12')
  })

  it('rejects malformed input', () => {
    expect(previousMonthKey('2026-13')).toBeNull()
    expect(previousMonthKey('nope')).toBeNull()
  })
})

describe('compareMonthMetric', () => {
  it('computes a relative change for income', () => {
    const transactions = [
      transaction('2026-08', 'income', 1000),
      transaction('2026-07', 'income', 800),
    ]
    expect(compareMonthMetric(transactions, '2026-08', 'income')).toEqual({
      current: 1000,
      previous: 800,
      changePercent: 25,
      changePoints: null,
    })
  })

  it('returns null deltas when the previous month has no data', () => {
    const transactions = [transaction('2026-08', 'income', 1000)]
    expect(compareMonthMetric(transactions, '2026-08', 'income')).toEqual({
      current: 1000,
      previous: null,
      changePercent: null,
      changePoints: null,
    })
  })

  it('compares the savings rate in percentage points, not percent', () => {
    const transactions = [
      transaction('2026-08', 'income', 1000),
      transaction('2026-08', 'expense', 300),
      transaction('2026-07', 'income', 1000),
      transaction('2026-07', 'expense', 500),
    ]
    expect(compareMonthMetric(transactions, '2026-08', 'savingsRate')).toEqual({
      current: 70,
      previous: 50,
      changePercent: null,
      changePoints: 20,
    })
  })

  it('computes savings deltas for currency sums', () => {
    const transactions = [
      transaction('2026-08', 'income', 1000),
      transaction('2026-08', 'expense', 300),
      transaction('2026-07', 'income', 1000),
      transaction('2026-07', 'expense', 600),
    ]
    expect(compareMonthMetric(transactions, '2026-08', 'savings')).toEqual({
      current: 700,
      previous: 400,
      changePercent: 75,
      changePoints: null,
    })
  })

  it('ignores rows outside the two compared months', () => {
    const transactions = [
      transaction('2026-06', 'income', 9999),
      transaction('2026-08', 'income', 1000),
      transaction('2026-07', 'income', 800),
    ]
    expect(compareMonthMetric(transactions, '2026-08', 'income').current).toBe(1000)
  })
})