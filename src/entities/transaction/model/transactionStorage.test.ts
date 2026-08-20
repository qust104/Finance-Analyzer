// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readTransactions, writeTransactions } from './transactionStorage'
import { DEFAULT_ACCOUNT } from './types'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('transactionStorage migration', () => {
  it('brands legacy rows without an account with the default account', () => {
    localStorage.setItem(
      'finance-analyzer.transactions.v2',
      JSON.stringify([
        {
          id: 'legacy-1',
          date: '2026-08-01',
          amount: 100,
          type: 'expense',
          category: 'food',
          description: 'Legacy row',
        },
      ]),
    )

    const [row] = readTransactions() ?? []
    expect(row?.account).toBe(DEFAULT_ACCOUNT)
  })

  it('persists migrated rows so the default survives a reload', () => {
    localStorage.setItem(
      'finance-analyzer.transactions.v2',
      JSON.stringify([
        {
          id: 'legacy-1',
          date: '2026-08-01',
          amount: 100,
          type: 'expense',
          category: 'food',
          description: 'Legacy row',
        },
      ]),
    )
    readTransactions()

    const stored = JSON.parse(localStorage.getItem('finance-analyzer.transactions.v2') ?? '[]')
    expect(stored[0].account).toBe(DEFAULT_ACCOUNT)
  })

  it('keeps explicit accounts untouched', () => {
    writeTransactions([
      {
        id: 'new-1',
        date: '2026-08-01',
        amount: 100,
        type: 'expense',
        category: 'food',
        description: 'Cash row',
        account: 'Cash',
      },
    ])

    const [row] = readTransactions() ?? []
    expect(row?.account).toBe('Cash')
  })
})