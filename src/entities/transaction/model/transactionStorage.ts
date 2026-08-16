import type { Transaction } from './types'

const STORAGE_KEY = 'finance-analyzer.transactions'
const STORAGE_VERSION = 1
const STORAGE_KEY_VERSIONED = `${STORAGE_KEY}.v${STORAGE_VERSION}`

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    ISO_DATE_PATTERN.test(candidate.date) &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    (candidate.type === 'income' || candidate.type === 'expense') &&
    typeof candidate.category === 'string' &&
    candidate.category.length > 0 &&
    typeof candidate.description === 'string'
  )
}

// localStorage is an untrusted source: parsing, validation and a safe
// fallback live here so corrupted data can never crash the application.
export function readTransactions(): Transaction[] | null {
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

  const valid = parsed.filter(isTransaction)
  // Persist the cleaned list so broken rows are not repaired on every load.
  if (valid.length !== parsed.length) {
    writeTransactions(valid)
  }
  return valid
}

export function writeTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VERSIONED, JSON.stringify(transactions))
  } catch {
    // Storage may be unavailable (quota, private mode); the app keeps working in memory.
  }
}
