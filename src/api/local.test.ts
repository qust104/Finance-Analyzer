// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { handleLocalRequest } from './local'

const validTransaction = {
  date: '2026-08-01',
  amount: 100,
  category: 'food',
  type: 'expense',
  description: 'Lunch',
}

beforeEach(() => {
  localStorage.clear()
})

describe('local server', () => {
  it('returns the transaction list', () => {
    const result = handleLocalRequest('http://localhost/api/transactions')
    expect(result.status).toBe(200)
    expect(Array.isArray(result.body)).toBe(true)
  })

  it('creates a transaction', () => {
    const result = handleLocalRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(validTransaction),
    })
    expect(result.status).toBe(201)
  })

  it('rejects an invalid transaction with 400', () => {
    const result = handleLocalRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ amount: -5 }),
    })
    expect(result.status).toBe(400)
  })

  it('returns 404 for an unknown id', () => {
    const result = handleLocalRequest('/api/transactions/missing', {
      method: 'PATCH',
      body: JSON.stringify(validTransaction),
    })
    expect(result.status).toBe(404)
  })

  it('returns the analytics summary for seeded data', () => {
    const result = handleLocalRequest('/api/analytics')
    expect(result.status).toBe(200)
    const body = result.body as {
      month: string
      summary: { balance: number; income: number }
      insights: unknown[]
    }
    expect(body.month).toMatch(/^\d{4}-\d{2}$/)
    expect(typeof body.summary.balance).toBe('number')
    expect(typeof body.summary.income).toBe('number')
    expect(Array.isArray(body.insights)).toBe(true)
  })

  it('matches paths prefixed with the deployment base', () => {
    const original = import.meta.env.BASE_URL
    import.meta.env.BASE_URL = '/Finance-Analyzer/'
    try {
      const result = handleLocalRequest('http://localhost/Finance-Analyzer/api/transactions')
      expect(result.status).toBe(200)
    } finally {
      import.meta.env.BASE_URL = original
    }
  })

  it('returns 404 for an unknown route', () => {
    const result = handleLocalRequest('/api/nope')
    expect(result.status).toBe(404)
  })

  it('replaces all data through PUT /api/data', () => {
    const result = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({
        transactions: [
          { id: 'x1', date: '2026-01-05', amount: 42, category: 'food', type: 'expense', description: 'Tea' },
        ],
        budgets: [
          { id: 'x2', category: 'food', amount: 999, period: 'monthly' },
        ],
      }),
    })
    expect(result.status).toBe(200)

    const transactions = handleLocalRequest('/api/transactions').body as unknown[]
    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toMatchObject({ id: 'x1', amount: 42 })
  })

  it('rejects a malformed data payload with 400', () => {
    const bad = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({
        transactions: [{ id: 'y', date: 'nope', amount: 5, category: 'food', type: 'expense', description: 'X' }],
        budgets: [],
      }),
    })
    expect(bad.status).toBe(400)

    const missingArrays = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ transactions: [] }),
    })
    expect(missingArrays.status).toBe(400)
  })
})