import { describe, expect, it } from 'vitest'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { buildSearchIndex, searchIndex } from './searchIndex'

const transaction: Transaction = {
  id: 't-1',
  description: 'Groceries',
  type: 'expense',
  category: 'food',
  amount: 1200,
  date: '2026-08-10',
  createdAt: '2026-08-10T10:00:00.000Z',
}

const budget: Budget = {
  id: 'b-1',
  category: 'food',
  amount: 8000,
  month: '2026-08',
}

it('builds results for transactions, budgets, categories and pages', () => {
  const index = buildSearchIndex(
    [transaction],
    [budget],
    [{ key: 'food', label: 'Food', icon: '🍎', color: '#ff0000' }],
  )

  const types = index.map((result) => result.type)
  expect(types).toEqual(['transaction', 'budget', 'category', ...Array(7).fill('page')])
  expect(index.some((result) => result.title === 'Groceries' && result.href)).toBe(true)
})

it('matches substrings case-insensitively across titles and subtitles', () => {
  const index = buildSearchIndex(
    [transaction],
    [budget],
    [{ key: 'food', label: 'Food', icon: '🍎', color: '#ff0000' }],
  )

  expect(searchIndex(index, 'groc').map((result) => result.id)).toEqual(['t-1'])
  expect(searchIndex(index, 'FOOD').map((result) => result.id)).toEqual(['b-1', 'food'])
  expect(searchIndex(index, '10.08').map((result) => result.id)).toEqual(['t-1'])
})

it('returns nothing for an empty or unmatched query', () => {
  const index = buildSearchIndex([], [], [])
  expect(searchIndex(index, '')).toEqual([])
  expect(searchIndex(index, 'zebra')).toEqual([])
})