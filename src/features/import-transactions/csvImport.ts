import type { TransactionInput } from '../../entities/transaction/model/repository'
import { ALL_CATEGORIES } from '../../entities/transaction/model/types'
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

// CSV exports rarely match our canonical values exactly:
// "Food", "FOOD", "еда" and "groceries" all mean the same category.
const CATEGORY_ALIASES: Record<string, Category> = {
  еда: 'food',
  продукты: 'food',
  groceries: 'food',
  grocery: 'food',
  транспорт: 'transport',
  покупки: 'shopping',
  шоппинг: 'shopping',
  shopping: 'shopping',
  развлечения: 'entertainment',
  досуг: 'entertainment',
  entertainment: 'entertainment',
  здоровье: 'health',
  медицина: 'health',
  жильё: 'housing',
  аренда: 'housing',
  housing: 'housing',
  зарплата: 'salary',
  зп: 'salary',
  salary: 'salary',
  прочее: 'other',
  другое: 'other',
}

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

export function parseCsvCategory(raw: string): Category | null {
  const key = raw.trim().toLowerCase()
  if ((ALL_CATEGORIES as readonly string[]).includes(key)) {
    return key as Category
  }
  return CATEGORY_ALIASES[key] ?? null
}

// CSV data comes from outside and cannot be trusted: every cell must be
// re-validated even though the manual form already validates its input.
export function normalizeCsvRow(cells: string[], headers: string[]): NormalizeRowResult {
  const cell = (name: string) => cells[headers.indexOf(name)] ?? ''
  const errors: string[] = []

  const rawDate = cell('date').trim()
  const rawDescription = cell('description').trim()
  const amount = parseCsvAmount(cell('amount'))
  const type = parseCsvType(cell('type'))
  const category = parseCsvCategory(cell('category'))

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
    value: { date, amount, type, category, description: rawDescription },
  }
}

// Same date, amount and description must not land in the store twice,
// whether the duplicate lives in the CSV or already exists locally.
export function transactionFingerprint(transaction: {
  date: string
  amount: number
  description: string
}): string {
  return `${transaction.date}|${transaction.amount}|${transaction.description.toLowerCase()}`
}

export function buildImportPreview(text: string, existing: readonly Transaction[]): ImportPreview {
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

  const seen = new Set(existing.map((transaction) => transactionFingerprint(transaction)))
  const valid: TransactionInput[] = []
  const invalid = parsed.structuralErrors.map((error) => ({
    row: error.row,
    errors: [error.message],
  }))
  const duplicates: number[] = []

  for (const entry of parsed.rows) {
    const result = normalizeCsvRow(entry.cells, parsed.headers)
    if (!result.ok) {
      invalid.push({ row: entry.row, errors: result.errors })
      continue
    }
    const fingerprint = transactionFingerprint(result.value)
    if (seen.has(fingerprint)) {
      duplicates.push(entry.row)
      continue
    }
    seen.add(fingerprint)
    valid.push(result.value)
  }

  return { valid, invalid, duplicates, fileErrors }
}
