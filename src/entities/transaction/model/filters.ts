import type { Category, Transaction, TransactionType } from './types'

export interface TransactionFilters {
  search: string
  category: Category | 'all'
  type: TransactionType | 'all'
  month: string
  sortBy: 'date' | 'amount'
  sortDir: 'asc' | 'desc'
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  category: 'all',
  type: 'all',
  month: 'all',
  sortBy: 'date',
  sortDir: 'desc',
}

const MONTH_PATTERN = /^\d{4}-\d{2}$/

function isCategory(value: string): value is Category {
  return value.length > 0
}

// URL is the single source of truth for filtering, so unknown or
// malformed values must never leak into the app state.
export function parseFilters(searchParams: URLSearchParams): TransactionFilters {
  const rawCategory = searchParams.get('category')
  const rawType = searchParams.get('type')
  const rawMonth = searchParams.get('month')
  const rawSortBy = searchParams.get('sort')
  const rawSortDir = searchParams.get('dir')

  return {
    search: searchParams.get('q') ?? '',
    category: rawCategory && isCategory(rawCategory) ? rawCategory : 'all',
    type: rawType === 'income' || rawType === 'expense' ? rawType : 'all',
    month: rawMonth && MONTH_PATTERN.test(rawMonth) ? rawMonth : 'all',
    sortBy: rawSortBy === 'amount' || rawSortBy === 'date' ? rawSortBy : 'date',
    sortDir: rawSortDir === 'asc' || rawSortDir === 'desc' ? rawSortDir : 'desc',
  }
}

export function serializeFilters(filters: TransactionFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search !== '') {
    params.set('q', filters.search)
  }
  if (filters.category !== 'all') {
    params.set('category', filters.category)
  }
  if (filters.type !== 'all') {
    params.set('type', filters.type)
  }
  if (filters.month !== 'all') {
    params.set('month', filters.month)
  }
  if (filters.sortBy !== 'date') {
    params.set('sort', filters.sortBy)
  }
  if (filters.sortDir !== 'desc') {
    params.set('dir', filters.sortDir)
  }
  return params
}

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.type !== 'all' ||
    filters.month !== 'all'
  )
}

export function applyFilters(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const query = filters.search.trim().toLowerCase()

  const filtered = transactions.filter((transaction) => {
    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false
    }
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false
    }
    if (filters.month !== 'all' && !transaction.date.startsWith(filters.month)) {
      return false
    }
    if (query !== '' && !transaction.description.toLowerCase().includes(query)) {
      return false
    }
    return true
  })

  const direction = filters.sortDir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'amount') {
      return (a.amount - b.amount) * direction
    }
    return a.date.localeCompare(b.date) * direction
  })
}

export function getAvailableMonths(transactions: readonly Transaction[]): string[] {
  const months = new Set(transactions.map((transaction) => transaction.date.slice(0, 7)))
  return [...months].sort().reverse()
}
