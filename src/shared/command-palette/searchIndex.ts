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

export interface MatchSpan {
  start: number
  end: number
}

// Cheap fuzzy match: the query must appear as a subsequence of the
// text (allowing skipped characters). Returns the ranges to highlight
// and a score where lower is better.
export interface MatchInfo {
  score: number
  spans: MatchSpan[]
}

const PREFIX_SCORE = 0
const CONTIGUOUS_SCORE = 1
const SUBSEQUENCE_SCORE = 2

export function scoreMatch(text: string, query: string): MatchInfo | null {
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()
  if (needle === '') {
    return null
  }

  if (haystack.startsWith(needle)) {
    return { score: PREFIX_SCORE, spans: [{ start: 0, end: needle.length }] }
  }

  const contiguous = haystack.indexOf(needle)
  if (contiguous !== -1) {
    return {
      score: CONTIGUOUS_SCORE,
      spans: [{ start: contiguous, end: contiguous + needle.length }],
    }
  }

  // Subsequence pass: walk the needle through the text, remember each
  // hit, then merge adjacent hits into single spans for highlighting.
  const hits: number[] = []
  let cursor = 0
  for (const char of needle) {
    const at = haystack.indexOf(char, cursor)
    if (at === -1) {
      return null
    }
    hits.push(at)
    cursor = at + 1
  }

  const spans: MatchSpan[] = hits.map((position) => ({ start: position, end: position + 1 }))
  const merged: MatchSpan[] = []
  for (const span of spans) {
    const previous = merged[merged.length - 1]
    if (previous && previous.end === span.start) {
      previous.end = span.end
    } else {
      merged.push({ ...span })
    }
  }

  return { score: SUBSEQUENCE_SCORE + cursor / text.length, spans: merged }
}

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

export const STATIC_PAGES: readonly { id: string; label: string; href: string }[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'transactions', label: 'Transactions', href: '/transactions' },
  { id: 'budgets', label: 'Budgets', href: '/budgets' },
  { id: 'categories', label: 'Categories', href: '/categories' },
  { id: 'recurring', label: 'Recurring', href: '/recurring' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]

export interface RankedResult {
  result: SearchResult
  match: MatchInfo
  titleSpans: MatchSpan[]
  subtitleSpans: MatchSpan[]
}

// The query is matched against both title and subtitle; the better
// match wins for ranking, both keep their own highlight ranges.
export function rankResults(
  index: readonly SearchResult[],
  query: string,
): RankedResult[] {
  const q = query.trim()
  if (q === '') {
    return []
  }

  const ranked: RankedResult[] = []
  for (const result of index) {
    const titleMatch = scoreMatch(result.title, q)
    const subtitleMatch = scoreMatch(result.subtitle, q)
    const match =
      titleMatch && subtitleMatch
        ? titleMatch.score <= subtitleMatch.score
          ? titleMatch
          : subtitleMatch
        : (titleMatch ?? subtitleMatch)
    if (!match) {
      continue
    }
    ranked.push({
      result,
      match,
      titleSpans: titleMatch?.spans ?? [],
      subtitleSpans: subtitleMatch?.spans ?? [],
    })
  }

  return ranked.sort((a, b) => a.match.score - b.match.score)
}

// Each group caps its visible entries so the palette stays compact;
// the ranking already put the best matches first.
export const GROUP_LIMITS: Record<SearchResult['type'], number> = {
  transaction: 8,
  budget: 5,
  category: 5,
  page: 7,
}

export interface GroupedResults {
  groups: { type: SearchResult['type']; items: RankedResult[]; more: number }[]
  total: number
}

export function groupResults(ranked: readonly RankedResult[]): GroupedResults {
  const order: SearchResult['type'][] = ['transaction', 'budget', 'category', 'page']
  const groups = order
    .map((type) => {
      const items = ranked.filter((entry) => entry.result.type === type)
      const limit = GROUP_LIMITS[type]
      return { type, items: items.slice(0, limit), more: Math.max(0, items.length - limit) }
    })
    .filter((group) => group.items.length > 0)
  return { groups, total: ranked.length }
}