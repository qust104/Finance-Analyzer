import { describe, expect, it } from 'vitest'
import type { Transaction } from './types'
import {
  DEFAULT_FILTERS,
  applyFilters,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
} from './filters'

const baseTransaction: Transaction = {
  id: 't-1',
  description: 'Groceries',
  type: 'expense',
  category: 'food',
  amount: 1200,
  date: '2026-08-10',
  account: 'Checking Account',
}

describe('parseFilters / serializeFilters', () => {
  it('round-trips the new range filters', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      from: '2026-08-01',
      to: '2026-08-31',
      minAmount: '100',
      maxAmount: '1200.50',
    }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('ignores malformed dates and amounts', () => {
    const url = new URLSearchParams('?from=08-01-2026&to=not-a-date&min=abc&max=1.234')
    const filters = parseFilters(url)
    expect(filters.from).toBe('')
    expect(filters.to).toBe('')
    expect(filters.minAmount).toBe('')
    expect(filters.maxAmount).toBe('')
  })

  it('omits empty range params from the URL', () => {
    expect(serializeFilters(DEFAULT_FILTERS).toString()).toBe('')
  })
})

describe('hasActiveFilters', () => {
  it('treats the new fields as active filters', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, from: '2026-08-01' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, minAmount: '10' })).toBe(true)
  })
})

describe('applyFilters', () => {
  const transactions: Transaction[] = [
    baseTransaction,
    { ...baseTransaction, id: 't-2', description: 'Salary', type: 'income', amount: 100000, date: '2026-08-01' },
    { ...baseTransaction, id: 't-3', description: 'Coffee', amount: 250, date: '2026-07-15' },
  ]

  it('filters by an inclusive date range', () => {
    const filtered = applyFilters(transactions, {
      ...DEFAULT_FILTERS,
      from: '2026-08-01',
      to: '2026-08-31',
    })
    expect(filtered.map((transaction) => transaction.id)).toEqual(['t-1', 't-2'])
  })

  it('combines amount bounds', () => {
    const filtered = applyFilters(transactions, {
      ...DEFAULT_FILTERS,
      minAmount: '300',
      maxAmount: '2000',
    })
    expect(filtered.map((transaction) => transaction.id)).toEqual(['t-1'])
  })

  it('stacks range filters with the existing ones', () => {
    const filtered = applyFilters(transactions, {
      ...DEFAULT_FILTERS,
      type: 'expense',
      minAmount: '100',
    })
    expect(filtered.map((transaction) => transaction.id)).toEqual(['t-1', 't-3'])
  })
})