import { ALL_CATEGORIES } from '../../transaction/model/types'
import type { Budget } from './types'

const STORAGE_KEY = 'finance-analyzer.budgets'
const STORAGE_VERSION = 1
const STORAGE_KEY_VERSIONED = `${STORAGE_KEY}.v${STORAGE_VERSION}`

export function isBudget(value: unknown): value is Budget {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.category === 'string' &&
    (ALL_CATEGORIES as readonly string[]).includes(candidate.category) &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    candidate.period === 'monthly'
  )
}

// Same storage contract as transactions: parse, validate, fall back.
export function readBudgets(): Budget[] | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY_VERSIONED)
  } catch {
    return null
  }

  if (raw === null) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!Array.isArray(parsed)) {
    return null
  }

  const valid = parsed.filter(isBudget)
  if (valid.length !== parsed.length) {
    writeBudgets(valid)
  }
  return valid
}

export function writeBudgets(budgets: Budget[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VERSIONED, JSON.stringify(budgets))
  } catch {
    // Storage may be unavailable; the app keeps working in memory.
  }
}
