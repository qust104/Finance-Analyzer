import { http, HttpResponse } from 'msw'
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

// Node has no location, so relative paths never match in tests;
// the browser resolves "window.location.origin" to the same base.
// The deployment base ("" in dev, "/Finance-Analyzer" on Pages) must
// match the URLs the API layer sends, or the worker scope mismatch
// would send requests to the network instead of the mock backend.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
export const API_BASE =
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost') + basePath

// The mock backend is the server side of the app: it keeps working
// against the same localStorage storage layer and hands out data
// through the same repository interface the UI used before the API.
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

export const handlers = [
  http.get(`${API_BASE}/api/transactions`, () => HttpResponse.json(transactions.getAll())),

  http.post(`${API_BASE}/api/transactions`, async ({ request }) => {
    const body = (await request.json()) as unknown
    const input = parseTransactionInput(body)
    if ('error' in input) {
      return HttpResponse.json(input.error, { status: 400 })
    }
    return HttpResponse.json(transactions.create(input.value), { status: 201 })
  }),

  http.patch(`${API_BASE}/api/transactions/:id`, async ({ request, params }) => {
    const body = (await request.json()) as unknown
    const input = parseTransactionInput(body)
    if ('error' in input) {
      return HttpResponse.json(input.error, { status: 400 })
    }
    try {
      return HttpResponse.json(transactions.update(String(params.id), input.value))
    } catch {
      return HttpResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
  }),

  http.delete(`${API_BASE}/api/transactions/:id`, ({ params }) => {
    transactions.delete(String(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_BASE}/api/budgets`, () => HttpResponse.json(budgets.getAll())),

  // One budget per category: the API enforces what the form prevents.
  http.post(`${API_BASE}/api/budgets`, async ({ request }) => {
    const body = (await request.json()) as unknown
    const parsed = transactionSchema.pick({ category: true, amount: true }).safeParse(body)
    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid budget data' }, { status: 400 })
    }
    if (budgets.getAll().some((budget) => budget.category === parsed.data.category)) {
      return HttpResponse.json({ error: 'Category already has a budget' }, { status: 409 })
    }
    return HttpResponse.json(budgets.create({ ...parsed.data, period: 'monthly' }), { status: 201 })
  }),

  http.patch(`${API_BASE}/api/budgets/:id`, async ({ request, params }) => {
    const body = (await request.json()) as unknown
    const parsed = transactionSchema.pick({ category: true, amount: true }).safeParse(body)
    if (!parsed.success) {
      return HttpResponse.json({ error: 'Invalid budget data' }, { status: 400 })
    }
    try {
      return HttpResponse.json(
        budgets.update(String(params.id), { ...parsed.data, period: 'monthly' }),
      )
    } catch {
      return HttpResponse.json({ error: 'Budget not found' }, { status: 404 })
    }
  }),

  http.delete(`${API_BASE}/api/budgets/:id`, ({ params }) => {
    budgets.delete(String(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_BASE}/api/analytics`, () => {
    const all = transactions.getAll()
    const month = getLatestMonthKey(all)
    return HttpResponse.json({
      month,
      summary: {
        balance: calculateBalance(all),
        income: calculateTotalIncome(all),
        expenses: calculateTotalExpenses(all),
        savings: calculateSavings(all),
        savingsRate: calculateSavingsRate(all),
      },
      insights: generateInsights(all, budgets.getAll(), month),
    })
  }),
]
