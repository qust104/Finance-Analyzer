import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { handlers } from './handlers'

const server = setupServer(...handlers)

// Unlike browsers, Node fetch refuses relative URLs; the app itself
// keeps using browser-relative paths like "/api/transactions".
const BASE = 'http://localhost'
const api = (path: string) => new URL(path, BASE)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('mock API', () => {
  it('returns the transaction list', async () => {
    const response = await fetch(api('/api/transactions'))

    expect(response.status).toBe(200)
    const data = (await response.json()) as unknown
    expect(Array.isArray(data)).toBe(true)
  })

  it('returns the budget list', async () => {
    const response = await fetch(api('/api/budgets'))

    expect(response.status).toBe(200)
    const data = (await response.json()) as unknown
    expect(Array.isArray(data)).toBe(true)
  })

  it('rejects an invalid transaction with 400', async () => {
    const response = await fetch(api('/api/transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-08-01',
        description: 'Broken',
        amount: -5,
        type: 'expense',
        category: 'food',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('creates and patches a transaction', async () => {
    const createdResponse = await fetch(api('/api/transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-08-01',
        description: 'Pyaterochka',
        amount: 500,
        type: 'expense',
        category: 'food',
      }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json()) as { id: string }

    const patchedResponse = await fetch(api(`/api/transactions/${created.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-08-01',
        description: 'Pyaterochka',
        amount: 600,
        type: 'expense',
        category: 'food',
      }),
    })
    expect(patchedResponse.status).toBe(200)
  })

  it('rejects a duplicated budget category with 409', async () => {
    const input = { category: 'shopping', amount: 1000, period: 'monthly' }
    await fetch(api('/api/budgets'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const second = await fetch(api('/api/budgets'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    expect(second.status).toBe(409)
  })
})
