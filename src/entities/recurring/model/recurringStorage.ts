import type { RecurringDef } from './types'

const STORAGE_KEY = 'finance-analyzer.recurring'
const STORAGE_VERSION = 1
const STORAGE_KEY_VERSIONED = `${STORAGE_KEY}.v${STORAGE_VERSION}`

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isRecurring(value: unknown): value is RecurringDef {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.description === 'string' &&
    candidate.description.length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    (candidate.type === 'income' || candidate.type === 'expense') &&
    typeof candidate.category === 'string' &&
    candidate.category.length > 0 &&
    (candidate.interval === 'weekly' ||
      candidate.interval === 'monthly' ||
      candidate.interval === 'yearly') &&
    typeof candidate.startDate === 'string' &&
    ISO_DATE.test(candidate.startDate) &&
    (candidate.endDate === null ||
      (typeof candidate.endDate === 'string' && ISO_DATE.test(candidate.endDate))) &&
    typeof candidate.active === 'boolean' &&
    (candidate.lastPostedDate === null ||
      (typeof candidate.lastPostedDate === 'string' && ISO_DATE.test(candidate.lastPostedDate)))
  )
}

// Same storage contract as transactions: parse, validate, fall back.
export function readRecurring(): RecurringDef[] | null {
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

  const valid = parsed.filter(isRecurring)
  if (valid.length !== parsed.length) {
    writeRecurring(valid)
  }
  return valid
}

export function writeRecurring(recurring: RecurringDef[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VERSIONED, JSON.stringify(recurring))
  } catch {
    // Storage may be unavailable; the app keeps working in memory.
  }
}