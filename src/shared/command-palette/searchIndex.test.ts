import { describe, expect, it } from 'vitest'
import type { Budget } from '../../entities/budget/model/types'
import type { CategoryDef } from '../../entities/category/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { buildSearchIndex, searchIndex } from './searchIndex'

const transaction: Transaction = {
  id: 't-1',
  description: 'Groceries',
  type: 'expense',
  category: 'food',
  amount: 1200,
  date: '2026-08-10',
}

const budget: Budget = {
  id: 'b-1',
  category: 'food',
  amount: 8000,
  period: 'monthly',
}

const food: CategoryDef = {
  key: 'food',
  label: 'Food',
  color: '#ff0000',
  aliases: [],
  builtin: true,
}

describe('search index', () => {
  it('builds results for transactions, budgets, categories and pages', () => {
    const index = buildSearchIndex([transaction], [budget], [food])

    const types = index.map((result) => result.type)
    expect(types).toEqual(['transaction', 'budget', 'category', ...Array(7).fill('page')])
    expect(index.some((result) => result.title === 'Groceries' && result.href)).toBe(true)
  })

  it('matches substrings case-insensitively across titles and subtitles', () => {
    const index = buildSearchIndex([transaction], [budget], [food])

    expect(searchIndex(index, 'groc').map((result) => result.id)).toEqual(['t-1'])
    expect(searchIndex(index, 'FOOD').map((result) => result.id)).toEqual(['b-1', 'food'])
    expect(searchIndex(index, '10.08').map((result) => result.id)).toEqual(['t-1'])
  })

  it('returns nothing for an empty or unmatched query', () => {
    const index = buildSearchIndex([], [], [])
    expect(searchIndex(index, '')).toEqual([])
    expect(searchIndex(index, 'zebra')).toEqual([])
  })
})