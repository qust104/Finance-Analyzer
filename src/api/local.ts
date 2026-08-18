import {
  calculateBalance,
  calculateSavings,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
} from '../analytics/calculations'
import { resolveReportMonth } from '../analytics/budgets'
import { generateInsights } from '../analytics/insights'
import { isBudget } from '../entities/budget/model/budgetStorage'
import { createLocalStorageBudgetRepository } from '../entities/budget/model/budgetRepository'
import { createLocalStorageCategoryRepository } from '../entities/category/model/categoryRepository'
import { BUILTIN_CATEGORIES } from '../entities/category/model/catalog'
import { categorySchema } from '../entities/category/model/categorySchema'
import { isCategoryDef } from '../entities/category/model/categoryStorage'
import { createLocalStorageRecurringRepository } from '../entities/recurring/model/recurringRepository'
import { recurringSchema } from '../entities/recurring/model/recurringSchema'
import { isRecurring } from '../entities/recurring/model/recurringStorage'
import { createLocalStorageTransactionRepository } from '../entities/transaction/model/repository'
import { isTransaction } from '../entities/transaction/model/transactionStorage'
import { transactionSchema } from '../entities/transaction/model/transactionSchema'
import { computeRecurringPlan } from '../features/recurring/schedule'

const today = () => new Date().toISOString().slice(0, 10)

export interface LocalResponse {
  status: number
  body?: unknown
}

// In production the app serves itself: there is no network and no
// service worker, so the "server side" runs inline. Dev and tests keep
// the real fetch path behind MSW; both share this single source.
const transactions = createLocalStorageTransactionRepository()
const budgets = createLocalStorageBudgetRepository()
const categories = createLocalStorageCategoryRepository()
const recurring = createLocalStorageRecurringRepository()

function parseTransactionInput(body: unknown) {
  const parsed = transactionSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid transaction data'
    return { error: { error: message } }
  }
  return { value: parsed.data }
}

// Referential integrity: a row may only reference a category that exists.
// The catalogue is not static (custom categories live in storage), so the
// check lives here, next to the repositories, not inside the Zod schema.
function categoryExists(key: string): boolean {
  return (
    BUILTIN_CATEGORIES.some((category) => category.key === key) ||
    categories.getAll().some((category) => category.key === key)
  )
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
    matchRoute(normalized, 'api/budgets/:id') ??
    matchRoute(normalized, 'api/categories/:key') ??
    matchRoute(normalized, 'api/recurring/:id')
  const restoreParams = matchRoute(normalized, 'api/recurring/:id/restore')
  const isList = normalized === '/api/transactions'
  const isBudgets = normalized === '/api/budgets'
  const isCategories = normalized === '/api/categories'
  const isRecurringList = normalized === '/api/recurring'
  const isRecurringApply = normalized === '/api/recurring/apply'
  const isAnalytics = normalized === '/api/analytics'
  const isData = normalized === '/api/data'
  const method = init?.method?.toUpperCase() ?? 'GET'

  if (normalized.startsWith('/api/transactions') && !isList && params) {
    if (method === 'PATCH') {
      const input = parseTransactionInput(parseBody(init))
      if ('error' in input) return { status: 400, body: input.error }
      if (!categoryExists(input.value.category)) {
        return { status: 400, body: { error: 'Unknown category' } }
      }
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
      if (!categoryExists(input.value.category)) {
        return { status: 400, body: { error: 'Unknown category' } }
      }
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

  if (isCategories) {
    if (method === 'GET') return { status: 200, body: categories.getAll() }
    if (method === 'POST') {
      const parsed = categorySchema.safeParse(parseBody(init))
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Invalid category data'
        return { status: 400, body: { error: message } }
      }
      try {
        return { status: 201, body: categories.create(parsed.data) }
      } catch (error) {
        return { status: 409, body: { error: (error as Error).message } }
      }
    }
  }

  if (normalized.startsWith('/api/categories') && !isCategories && params && params.key) {
    const key = String(params.key)
    if (method === 'PATCH') {
      const parsed = categorySchema.safeParse(parseBody(init))
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Invalid category data'
        return { status: 400, body: { error: message } }
      }
      try {
        return { status: 200, body: categories.update(key, parsed.data) }
      } catch (error) {
        return { status: 404, body: { error: (error as Error).message } }
      }
    }
    if (method === 'DELETE') {
      const inUseByTransactions = transactions.getAll().some((transaction) => transaction.category === key)
      const inUseByBudgets = budgets.getAll().some((budget) => budget.category === key)
      const inUseByRecurring = recurring.getAll().some((template) => template.category === key)
      if (inUseByTransactions || inUseByBudgets || inUseByRecurring) {
        return {
          status: 409,
          body: { error: 'This category is used by transactions, budgets or recurring templates' },
        }
      }
      try {
        categories.delete(key)
        return { status: 204 }
      } catch (error) {
        return { status: 403, body: { error: (error as Error).message } }
      }
    }
  }

  if (isRecurringApply && method === 'POST') {
    // The generator is idempotent: fingerprints of already-posted rows
    // keep it from creating duplicates even across partial failures.
    const plan = computeRecurringPlan(recurring.getAll(), transactions.getAll(), today())
    for (const input of plan.toCreate) {
      transactions.create(input)
    }
    for (const advance of plan.advances) {
      recurring.advance(advance.id, advance.lastPostedDate)
    }
    return { status: 200, body: { created: plan.toCreate.length } }
  }

  if (normalized.startsWith('/api/recurring') && !isRecurringList && params) {
    const id = String(params.id)
    if (id === 'apply') {
      return { status: 404, body: { error: 'Not found' } }
    }
    if (method === 'PATCH') {
      const parsed = recurringSchema.safeParse(parseBody(init))
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Invalid recurring data'
        return { status: 400, body: { error: message } }
      }
      if (!categoryExists(parsed.data.category)) {
        return { status: 400, body: { error: 'Unknown category' } }
      }
      try {
        return { status: 200, body: recurring.update(id, parsed.data) }
      } catch {
        return { status: 404, body: { error: 'Recurring template not found' } }
      }
    }
    if (method === 'DELETE') {
      recurring.delete(id)
      return { status: 204 }
    }
  }

  if (restoreParams) {
    if (method === 'POST') {
      // The whole template comes back (id and lastPostedDate included):
      // an undo must restore the exact state, not a recreated row.
      const template = parseBody(init)
      if (!isRecurring(template)) {
        return { status: 400, body: { error: 'Invalid recurring data' } }
      }
      return { status: 200, body: recurring.restore(template) }
    }
  }

  if (isRecurringList) {
    if (method === 'GET') return { status: 200, body: recurring.getAll() }
    if (method === 'POST') {
      const parsed = recurringSchema.safeParse(parseBody(init))
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Invalid recurring data'
        return { status: 400, body: { error: message } }
      }
      if (!categoryExists(parsed.data.category)) {
        return { status: 400, body: { error: 'Unknown category' } }
      }
      return { status: 201, body: recurring.create(parsed.data) }
    }
  }

  if (isAnalytics && method === 'GET') {
    const all = transactions.getAll()
    const month = resolveReportMonth(all).month
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
        insights: generateInsights(all, budgets.getAll(), month, categories.getAll()),
      },
    }
  }

  if (isData && method === 'PUT') {
    const body = parseBody(init) as
      | {
          transactions?: unknown
          budgets?: unknown
          categories?: unknown
          recurring?: unknown
        }
      | undefined
    const nextTransactions = Array.isArray(body?.transactions) ? body.transactions : null
    const nextBudgets = Array.isArray(body?.budgets) ? body.budgets : null
    if (nextTransactions === null || nextBudgets === null) {
      return { status: 400, body: { error: 'Expected { transactions, budgets } arrays' } }
    }
    if (!nextTransactions.every(isTransaction) || !nextBudgets.every(isBudget)) {
      return { status: 400, body: { error: 'Invalid data in payload' } }
    }
    // Backups written before categories existed carry no field:
    // leave the catalogue untouched then, replacing is opt-in.
    // The payload holds the full catalogue (built-in + custom), so rows
    // are validated as generic definitions; replaceAll keeps custom only.
    const nextCategories =
      body?.categories === undefined
        ? null
        : Array.isArray(body.categories) && body.categories.every(isCategoryDef)
          ? body.categories
          : undefined
    if (nextCategories === undefined) {
      return { status: 400, body: { error: 'Invalid categories in payload' } }
    }
    const nextRecurring =
      body?.recurring === undefined
        ? null
        : Array.isArray(body.recurring) && body.recurring.every(isRecurring)
          ? body.recurring
          : undefined
    if (nextRecurring === undefined) {
      return { status: 400, body: { error: 'Invalid recurring templates in payload' } }
    }
    transactions.replaceAll(nextTransactions)
    budgets.replaceAll(nextBudgets)
    if (nextCategories !== null) {
      categories.replaceAll(nextCategories)
    }
    if (nextRecurring !== null) {
      recurring.replaceAll(nextRecurring)
    }
    return {
      status: 200,
      body: {
        transactions: nextTransactions.length,
        budgets: nextBudgets.length,
      },
    }
  }

  return { status: 404, body: { error: 'Not found' } }
}