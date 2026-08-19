import { describe, expect, it } from 'vitest'
import type { Budget } from '../../entities/budget/model/types'
import type { CategoryDef } from '../../entities/category/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { buildSearchIndex, groupResults, rankResults, scoreMatch } from './searchIndex'

const transaction: Transaction = {
  id: 't-1',
  description: 'Groceries',
  type: 'expense',
  category: 'food',
  amount: 1200,
  date: '2026-08-10',
  account: 'Checking Account',
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

const manyTransactions: Transaction[] = Array.from({ length: 10 }, (_, index) => ({
  ...transaction,
  id: `t-${index}`,
  description: `Monthly rent #${index}`,
}))

describe('scoreMatch', () => {
  it('scores a prefix match the highest', () => {
    const match = scoreMatch('Groceries', 'groc')
    expect(match).not.toBeNull()
    expect(match!.score).toBe(0)
    expect(match!.spans).toEqual([{ start: 0, end: 4 }])
  })

  it('matches case-insensitively', () => {
    expect(scoreMatch('Groceries', 'GROC')?.score).toBe(0)
  })

  it('scores a contiguous substring below a prefix', () => {
    const match = scoreMatch('Groceries', 'ceri')
    expect(match!.score).toBe(1)
    expect(match!.spans).toEqual([{ start: 3, end: 7 }])
  })

  it('finds a subsequence with skipped characters', () => {
    const match = scoreMatch('Groceries', 'grs')
    expect(match!.score).toBeGreaterThanOrEqual(2)
    // adjacent hits ("gr") merge into a single span
    expect(match!.spans).toEqual([
      { start: 0, end: 2 },
      { start: 8, end: 9 },
    ])
  })

  it('merges adjacent hits into one span', () => {
    const match = scoreMatch('Groceries', 'gr')
    expect(match!.spans).toEqual([{ start: 0, end: 2 }])
  })

  it('rejects non-matches and empty queries', () => {
    expect(scoreMatch('Groceries', 'zzz')).toBeNull()
    expect(scoreMatch('Groceries', '')).toBeNull()
  })
})

describe('rankResults', () => {
  it('ranks prefix matches above contiguous and subsequence matches', () => {
    const index = buildSearchIndex([transaction], [], [])
    const ranked = rankResults(index, 'gro')

    expect(ranked).toHaveLength(1)
    expect(ranked[0].match.score).toBe(0)
    expect(ranked[0].titleSpans).toEqual([{ start: 0, end: 3 }])
  })

  it('ranks the best match first', () => {
    const groceries: Transaction = { ...transaction, id: 't-2', description: 'Groceries' }
    const monthly: Transaction = { ...transaction, id: 't-3', description: 'Monthly groceries' }
    const index = buildSearchIndex([monthly, groceries], [], [])

    const ranked = rankResults(index, 'groc')
    expect(ranked.map((entry) => entry.result.id)).toEqual(['t-2', 't-3'])
    expect(ranked[0].match.score).toBe(0)
    expect(ranked[1].match.score).toBe(1)
  })

  it('matches against the subtitle as a fallback', () => {
    const index = buildSearchIndex([transaction], [], [])
    const ranked = rankResults(index, '10.08')

    expect(ranked).toHaveLength(1)
    expect(ranked[0].result.id).toBe('t-1')
    expect(ranked[0].subtitleSpans).not.toHaveLength(0)
  })

  it('returns nothing for an empty or unmatched query', () => {
    const index = buildSearchIndex([], [], [])
    expect(rankResults(index, '')).toEqual([])
    expect(rankResults(index, 'zebra')).toEqual([])
  })
})

describe('groupResults', () => {
  it('caps transaction results and reports the overflow', () => {
    const index = buildSearchIndex(manyTransactions, [], [])
    const { groups, total } = groupResults(rankResults(index, 'monthly'))

    expect(total).toBe(10)
    const transactions = groups.find((group) => group.type === 'transaction')!
    expect(transactions.items).toHaveLength(8)
    expect(transactions.more).toBe(2)
  })

  it('keeps the fixed group order', () => {
    const delivery: Transaction = { ...transaction, id: 't-4', description: 'Food delivery' }
    const index = buildSearchIndex([delivery], [budget], [food])
    const { groups } = groupResults(rankResults(index, 'food'))

    expect(groups.map((group) => group.type)).toEqual(['transaction', 'budget', 'category'])
  })

  it('drops empty groups', () => {
    const index = buildSearchIndex([], [budget], [])
    const { groups } = groupResults(rankResults(index, 'food'))

    expect(groups.map((group) => group.type)).toEqual(['budget'])
  })
})

it('builds results for transactions, budgets, categories and pages', () => {
  const index = buildSearchIndex([transaction], [budget], [food])

  const types = index.map((result) => result.type)
  expect(types).toEqual(['transaction', 'budget', 'category', ...Array(7).fill('page')])
  expect(index.some((result) => result.title === 'Groceries' && result.href)).toBe(true)
})