import type { Budget } from '../../entities/budget/model/types'
import { categoryLabelOf } from '../../entities/category/model/catalog'
import type { CategoryDef } from '../../entities/category/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { formatCurrency, formatDate } from '../lib/format'

export interface SearchResult {
  type: 'transaction' | 'budget' | 'category' | 'page'
  id: string
  title: string
  subtitle: string
  href: string
}

export const STATIC_PAGES: readonly { id: string; label: string; href: string }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'transactions', label: 'Transactions', href: '/transactions' },
  { id: 'budgets', label: 'Budgets', href: '/budgets' },
  { id: 'categories', label: 'Categories', href: '/categories' },
  { id: 'recurring', label: 'Recurring', href: '/recurring' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]

const MAX_RESULTS = 20

// The index is built on the client from data the query cache already
// holds — fine for a personal tracker, no dedicated endpoint needed.
export function buildSearchIndex(
  transactions: readonly Transaction[],
  budgets: readonly Budget[],
  categories: readonly CategoryDef[],
): SearchResult[] {
  const transactionResults: SearchResult[] = transactions.map((transaction) => ({
    type: 'transaction',
    id: transaction.id,
    title: transaction.description,
    subtitle: `${formatCurrency(transaction.amount)} · ${formatDate(transaction.date)}`,
    href: `/transactions?highlight=${encodeURIComponent(transaction.id)}`,
  }))

  const budgetResults: SearchResult[] = budgets.map((budget) => ({
    type: 'budget',
    id: budget.id,
    title: categoryLabelOf(categories, budget.category),
    subtitle: `${formatCurrency(budget.amount)} / month`,
    href: '/budgets',
  }))

  const categoryResults: SearchResult[] = categories.map((category) => ({
    type: 'category',
    id: category.key,
    title: category.label,
    subtitle: 'Category',
    href: '/categories',
  }))

  const pageResults: SearchResult[] = STATIC_PAGES.map((page) => ({
    type: 'page',
    id: page.id,
    title: page.label,
    subtitle: 'Page',
    href: page.href,
  }))

  return [...transactionResults, ...budgetResults, ...categoryResults, ...pageResults]
}

// Plain substring match is enough for a few hundred local rows;
// no fuzzy-search dependency needed at this scale.
export function searchIndex(index: readonly SearchResult[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (q === '') {
    return []
  }
  return index
    .filter(
      (result) => result.title.toLowerCase().includes(q) || result.subtitle.toLowerCase().includes(q),
    )
    .slice(0, MAX_RESULTS)
}