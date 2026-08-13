import {
  calculateBalance,
  calculateSavings,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
} from '../analytics/calculations'
import { getLatestMonthKey } from '../analytics/budgets'
import { generateInsights } from '../analytics/insights'
import { createLocalStorageBudgetRepository } from '../entities/budget/model/budgetRepository'
import { createLocalStorageTransactionRepository } from '../entities/transaction/model/repository'
import { transactionSchema } from '../entities/transaction/model/transactionSchema'

export interface LocalResponse {
  status: number
  body?: unknown
}

// In production the app serves itself: there is no network and no
// service worker, so the "server side" runs inline. Dev and tests keep
// the real fetch path behind MSW; both share this single source.
const transactions = createLocalStorageTransactionRepository()
const budgets = createLocalStorageBudgetRepository()

function parseTransactionInput(body: unknown) {
  const parsed = transactionSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid transaction data'
    return { error: { error: message } }
  }
  return { value: parsed.data }
}

function parseBody(init?: RequestInit): unknown {
  const raw = init?.body
  if (raw == null) return undefined
  const text = typeof raw === 'string' ? raw : String(raw)
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const actual = path.split('/').filter(Boolean)
  const expected = pattern.split('/').filter(Boolean)
  if (actual.length !== expected.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < expected.length; i++) {
    if (expected[i].startsWith(':')) {
      params[expected[i].slice(1)] = decodeURIComponent(actual[i])
    } else if (expected[i] !== actual[i]) {
      return null
    }
  }
  return params
}

export function handleLocalRequest(url: string, init?: RequestInit): LocalResponse {
  const base = import.meta.env.BASE_URL
  const path = url.startsWith('http') ? new URL(url).pathname : url
  const normalized = '/' + path.slice(base.length)

  const params =
    matchRoute(normalized, 'api/transactions/:id') ??
    matchRoute(normalized, 'api/budgets/:id')
  const isList = normalized === '/api/transactions'
  const isBudgets = normalized === '/api/budgets'
  const isAnalytics = normalized === '/api/analytics'
  const method = init?.method?.toUpperCase() ?? 'GET'

  if (normalized.startsWith('/api/transactions') && !isList && params) {
    if (method === 'PATCH') {
      const input = parseTransactionInput(parseBody(init))
      if ('error' in input) return { status: 400, body: input.error }
      try {
        return { status: 200, body: transactions.update(String(params.id), input.value) }
      } catch {
        return { status: 404, body: { error: 'Transaction not found' } }
      }
    }
    if (method === 'DELETE') {
      transactions.delete(String(params.id))
      return { status: 204 }
    }
  }

  if (isList) {
    if (method === 'GET') return { status: 200, body: transactions.getAll() }
    if (method === 'POST') {
      const input = parseTransactionInput(parseBody(init))
      if ('error' in input) return { status: 400, body: input.error }
      return { status: 201, body: transactions.create(input.value) }
    }
  }

  if (normalized.startsWith('/api/budgets') && !isBudgets && params) {
    if (method === 'PATCH') {
      const parsed = transactionSchema
        .pick({ category: true, amount: true })
        .safeParse(parseBody(init))
      if (!parsed.success) return { status: 400, body: { error: 'Invalid budget data' } }
      try {
        return {
          status: 200,
          body: budgets.update(String(params.id), { ...parsed.data, period: 'monthly' }),
        }
      } catch {
        return { status: 404, body: { error: 'Budget not found' } }
      }
    }
    if (method === 'DELETE') {
      budgets.delete(String(params.id))
      return { status: 204 }
    }
  }

  if (isBudgets) {
    if (method === 'GET') return { status: 200, body: budgets.getAll() }
    if (method === 'POST') {
      const parsed = transactionSchema
        .pick({ category: true, amount: true })
        .safeParse(parseBody(init))
      if (!parsed.success) return { status: 400, body: { error: 'Invalid budget data' } }
      if (budgets.getAll().some((budget) => budget.category === parsed.data.category)) {
        return { status: 409, body: { error: 'Category already has a budget' } }
      }
      return {
        status: 201,
        body: budgets.create({ ...parsed.data, period: 'monthly' }),
      }
    }
  }

  if (isAnalytics && method === 'GET') {
    const all = transactions.getAll()
    const month = getLatestMonthKey(all)
    return {
      status: 200,
      body: {
        month,
        summary: {
          balance: calculateBalance(all),
          income: calculateTotalIncome(all),
          expenses: calculateTotalExpenses(all),
          savings: calculateSavings(all),
          savingsRate: calculateSavingsRate(all),
        },
        insights: generateInsights(all, budgets.getAll(), month),
      },
    }
  }

  return { status: 404, body: { error: 'Not found' } }
}