// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { BUILTIN_CATEGORIES } from '../entities/category/model/catalog'
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

  it('lists, creates, edits and deletes categories', () => {
    const created = handleLocalRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        label: 'Hobbies',
        color: '#7c3aed',
        aliases: ['guitar'],
      }),
    })
    expect(created.status).toBe(201)
    const key = (created.body as { key: string }).key

    const list = handleLocalRequest('/api/categories')
    const entries = list.body as Array<{ key: string; builtin: boolean }>
    expect(entries.some((entry) => entry.key === key && !entry.builtin)).toBe(true)

    const patched = handleLocalRequest(`/api/categories/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ label: 'Hobby', color: '#0ea5e9', aliases: [] }),
    })
    expect(patched.status).toBe(200)

    const deleted = handleLocalRequest(`/api/categories/${key}`, { method: 'DELETE' })
    expect(deleted.status).toBe(204)
  })

  it('rejects a duplicate or malformed category with 409/400', () => {
    const payload = JSON.stringify({ label: 'Pets', color: '#059669', aliases: [] })
    expect(handleLocalRequest('/api/categories', { method: 'POST', body: payload }).status).toBe(201)

    const bad = handleLocalRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Pets', color: 'red', aliases: [] }),
    })
    expect(bad.status).toBe(400)

    const duplicate = handleLocalRequest('/api/categories', { method: 'POST', body: payload })
    expect(duplicate.status).toBe(409)
  })

  it('locks down built-in categories: 403 on delete, 404 on edit', () => {
    // transport is never used by the data seeded earlier in this module,
    // so the in-use guard cannot fire before the built-in lock.
    const locked = handleLocalRequest('/api/categories/transport', { method: 'DELETE' })
    expect(locked.status).toBe(403)

    const missing = handleLocalRequest('/api/categories/transport', {
      method: 'PATCH',
      body: JSON.stringify({ label: 'Transit', color: '#14b8a6', aliases: [] }),
    })
    expect(missing.status).toBe(404)
  })

  it('refuses to delete a category used by transactions', () => {
    const created = handleLocalRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Travel', color: '#f43f5e', aliases: [] }),
    })
    const key = (created.body as { key: string }).key
    expect(key).toBe('travel')

    const transaction = handleLocalRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ ...validTransaction, category: 'travel' }),
    })
    expect(transaction.status).toBe(201)

    const deleted = handleLocalRequest(`/api/categories/${key}`, { method: 'DELETE' })
    expect(deleted.status).toBe(409)
  })

  it('restores the catalogue through PUT /api/data', () => {
    handleLocalRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Hobbies', color: '#7c3aed', aliases: [] }),
    })

    const result = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({
        transactions: [],
        budgets: [],
        categories: [
          { key: 'food', label: 'Food', color: '#f59e0b', aliases: [], builtin: true },
          { key: 'hobbies', label: 'Hobbies', color: '#7c3aed', aliases: ['guitar'], builtin: false },
        ],
      }),
    })
    expect(result.status).toBe(200)

    const entries = handleLocalRequest('/api/categories').body as Array<{ key: string }>
    expect(entries).toHaveLength(BUILTIN_CATEGORIES.length + 1)
    expect(entries.map((entry) => entry.key)).toContain('hobbies')
    expect(entries.map((entry) => entry.key)).not.toContain('pets')
  })

  it('rejects a data payload with malformed categories', () => {
    const result = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({
        transactions: [],
        budgets: [],
        categories: [{ key: 'x', label: 'X' }],
      }),
    })
    expect(result.status).toBe(400)
  })

  it('returns 409 when a category is in use by a budget', () => {
    handleLocalRequest('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category: 'travel', amount: 1000 }),
    })

    const created = handleLocalRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Travel', color: '#f43f5e', aliases: [] }),
    })
    const key = (created.body as { key: string }).key
    expect(key).toBe('travel')

    const deleted = handleLocalRequest(`/api/categories/${key}`, { method: 'DELETE' })
    expect(deleted.status).toBe(409)
  })

  it('lists, creates, edits and deletes recurring templates', () => {
    const created = handleLocalRequest('/api/recurring', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Rent',
        amount: 25000,
        type: 'expense',
        category: 'housing',
        interval: 'monthly',
        startDate: '2026-01-05',
        endDate: '',
        active: true,
      }),
    })
    expect(created.status).toBe(201)
    const id = (created.body as { id: string }).id

    const list = handleLocalRequest('/api/recurring')
    expect((list.body as unknown[]).some((entry) => (entry as { id: string }).id === id)).toBe(true)

    const patched = handleLocalRequest(`/api/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: 'Rent updated',
        amount: 26000,
        type: 'expense',
        category: 'housing',
        interval: 'monthly',
        startDate: '2026-01-05',
        endDate: '',
        active: false,
      }),
    })
    expect(patched.status).toBe(200)
    expect(patched.body).toMatchObject({ active: false, amount: 26000 })

    expect(handleLocalRequest(`/api/recurring/${id}`, { method: 'DELETE' }).status).toBe(204)
    expect(
      handleLocalRequest(`/api/recurring/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Rent',
          amount: 25000,
          type: 'expense',
          category: 'housing',
          interval: 'monthly',
          startDate: '2026-01-05',
          endDate: '',
          active: true,
        }),
      }).status,
    ).toBe(404)
  })

  it('rejects malformed recurring templates with 400', () => {
    const result = handleLocalRequest('/api/recurring', {
      method: 'POST',
      body: JSON.stringify({ description: 'Rent', amount: -5 }),
    })
    expect(result.status).toBe(400)
  })

  it('posts due recurring rows exactly once', () => {
    const created = handleLocalRequest('/api/recurring', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Gym',
        amount: 1000,
        type: 'expense',
        category: 'health',
        interval: 'monthly',
        startDate: '2000-01-05',
        endDate: '',
        active: true,
      }),
    })
    expect(created.status).toBe(201)

    const first = handleLocalRequest('/api/recurring/apply', { method: 'POST' })
    expect(first.status).toBe(200)
    const createdCount = ((first.body as { created: number }).created)
    expect(createdCount).toBeGreaterThan(0)

    const second = handleLocalRequest('/api/recurring/apply', { method: 'POST' })
    expect((second.body as { created: number }).created).toBe(0)

    const transactions = handleLocalRequest('/api/transactions').body as unknown[]
    const gym = transactions.filter((entry) => (entry as { description: string }).description === 'Gym')
    expect(gym).toHaveLength(createdCount)
    expect(gym.every((entry) => (entry as { type: string }).type === 'expense')).toBe(true)
  })

  it('advances templates but posts nothing while paused', () => {
    handleLocalRequest('/api/recurring', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Old sub',
        amount: 500,
        type: 'expense',
        category: 'entertainment',
        interval: 'weekly',
        startDate: '2000-01-01',
        endDate: '',
        active: false,
      }),
    })
    handleLocalRequest('/api/recurring/apply', { method: 'POST' })

    const transactions = handleLocalRequest('/api/transactions').body as unknown[]
    expect(transactions.some((entry) => (entry as { description: string }).description === 'Old sub')).toBe(false)
  })

  it('restores recurring templates through PUT /api/data and leaves them untouched when absent', () => {
    const template = {
      id: 'r-x',
      description: 'Salary',
      amount: 150000,
      type: 'income',
      category: 'salary',
      interval: 'monthly',
      startDate: '2026-01-05',
      endDate: null,
      active: true,
      lastPostedDate: '2026-07-05',
    }

    const withoutRecurring = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ transactions: [], budgets: [] }),
    })
    expect(withoutRecurring.status).toBe(200)
    expect(
      (handleLocalRequest('/api/recurring').body as unknown[]).some(
        (entry) => (entry as { id: string }).id === 'r-x',
      ),
    ).toBe(false)

    const withRecurring = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ transactions: [], budgets: [], recurring: [template] }),
    })
    expect(withRecurring.status).toBe(200)
    expect(handleLocalRequest('/api/recurring').body).toEqual([template])

    const broken = handleLocalRequest('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ transactions: [], budgets: [], recurring: [{ description: 'x' }] }),
    })
    expect(broken.status).toBe(400)
  })
})