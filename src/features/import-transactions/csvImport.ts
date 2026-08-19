import { resolveCategoryKey } from '../../entities/category/model/catalog'
import type { CategoryDef } from '../../entities/category/model/types'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import { DEFAULT_ACCOUNT } from '../../entities/transaction/model/types'
import type { Category, Transaction, TransactionType } from '../../entities/transaction/model/types'
import { parseCsv } from './parseCsv'

export interface ImportPreview {
  valid: TransactionInput[]
  invalid: { row: number; errors: string[] }[]
  duplicates: number[]
  fileErrors: string[]
}

export type NormalizeRowResult =
  { ok: true; value: TransactionInput } | { ok: false; errors: string[] }

const REQUIRED_COLUMNS = ['date', 'description', 'amount', 'type', 'category']

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Imported files are untrusted input: without limits a single file could
// freeze the tab while the synchronous parser walks millions of rows.
export const MAX_IMPORT_ROWS = 10_000
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export function parseCsvDate(raw: string): string | null {
  if (!ISO_DATE.test(raw)) return null
  const [year, month, day] = raw.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isValid ? raw : null
}

// "2 340,50" and "2340.50" and "2340,50" must all parse.
export function parseCsvAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return null
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function parseCsvType(raw: string): TransactionType | null {
  const trimmed = raw.trim().toLowerCase()
  return trimmed === 'income' || trimmed === 'expense' ? trimmed : null
}

// CSV exports rarely match our canonical keys exactly: "Food", "FOOD",
// "еда" and "groceries" all mean the same category. Matching runs against
// the live catalogue (keys, display labels, per-category aliases), so a
// custom category resolves through the aliases the user configured.
export function parseCsvCategory(categories: readonly CategoryDef[], raw: string): Category | null {
  return resolveCategoryKey(categories, raw)
}

// CSV data comes from outside and cannot be trusted: every cell must be
// re-validated even though the manual form already validates its input.
export function normalizeCsvRow(
  cells: string[],
  headers: string[],
  categories: readonly CategoryDef[],
): NormalizeRowResult {
  const cell = (name: string) => cells[headers.indexOf(name)] ?? ''
  const errors: string[] = []

  const rawDate = cell('date').trim()
  const rawDescription = cell('description').trim()
  const amount = parseCsvAmount(cell('amount'))
  const type = parseCsvType(cell('type'))
  const category = parseCsvCategory(categories, cell('category'))

  const date = parseCsvDate(rawDate)
  if (date === null) {
    errors.push(`Invalid date "${rawDate}", expected YYYY-MM-DD`)
  }
  if (amount === null) {
    errors.push('Amount must be a positive number')
  }
  if (type === null) {
    errors.push('Type must be "income" or "expense"')
  }
  if (category === null) {
    errors.push('Unknown category')
  }
  if (rawDescription === '') {
    errors.push('Description is required')
  }

  if (
    date === null ||
    amount === null ||
    type === null ||
    category === null ||
    rawDescription === ''
  ) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    value: {
      date,
      amount,
      type,
      category,
      description: rawDescription,
      account: DEFAULT_ACCOUNT,
    },
  }
}

// Same date, amount and description are too coarse to tell a repeated
// purchase (two coffees a day) from a duplicate import of the same file.
// Rows are deduplicated by quota instead of a plain set: a file may keep
// as many copies of a fingerprint as it has more of them than the store
// already holds, so a fresh file imports legitimate repeats in full while
// re-importing the same file adds nothing.
export function transactionFingerprint(transaction: {
  date: string
  amount: number
  description: string
}): string {
  return `${transaction.date}|${transaction.amount}|${transaction.description.toLowerCase()}`
}

export function buildImportPreview(
  text: string,
  existing: readonly Transaction[],
  categories: readonly CategoryDef[],
): ImportPreview {
  const parsed = parseCsv(text)
  const fileErrors: string[] = []

  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    fileErrors.push(`The file has too many rows. Maximum is ${MAX_IMPORT_ROWS} rows.`)
    return { valid: [], invalid: [], duplicates: [], fileErrors }
  }

  if (parsed.headers.length === 0) {
    fileErrors.push('The file is empty or has no header row')
  } else {
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !parsed.headers.includes(column))
    if (missingColumns.length > 0) {
      fileErrors.push(`Missing columns: ${missingColumns.join(', ')}`)
    }
  }
  if (fileErrors.length > 0) {
    return { valid: [], invalid: [], duplicates: [], fileErrors }
  }

  const normalized = parsed.rows.map((entry) => ({
    row: entry.row,
    result: normalizeCsvRow(entry.cells, parsed.headers, categories),
  }))

  const fileCount = new Map<string, number>()
  for (const { result } of normalized) {
    if (result.ok) {
      const fingerprint = transactionFingerprint(result.value)
      fileCount.set(fingerprint, (fileCount.get(fingerprint) ?? 0) + 1)
    }
  }

  const existingCount = new Map<string, number>()
  for (const transaction of existing) {
    const fingerprint = transactionFingerprint(transaction)
    existingCount.set(fingerprint, (existingCount.get(fingerprint) ?? 0) + 1)
  }

  const valid: TransactionInput[] = []
  const invalid = parsed.structuralErrors.map((error) => ({
    row: error.row,
    errors: [error.message],
  }))
  const duplicates: number[] = []
  const acceptedCount = new Map<string, number>()

  for (const { row, result } of normalized) {
    if (!result.ok) {
      invalid.push({ row, errors: result.errors })
      continue
    }
    // The quota is how many copies the file holds beyond what the store
    // already has: copies within that quota are real data, the rest are
    // a second run of the same import.
    const fingerprint = transactionFingerprint(result.value)
    const quota = Math.max(
      (fileCount.get(fingerprint) ?? 0) - (existingCount.get(fingerprint) ?? 0),
      0,
    )
    const accepted = acceptedCount.get(fingerprint) ?? 0
    if (accepted >= quota) {
      duplicates.push(row)
      continue
    }
    acceptedCount.set(fingerprint, accepted + 1)
    valid.push(result.value)
  }

  return { valid, invalid, duplicates, fileErrors }
}
