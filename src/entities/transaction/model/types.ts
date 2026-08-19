export type TransactionType = 'income' | 'expense'

// A transaction stores the category key: a built-in slug or a custom
// category created by the user. The catalogue itself lives in
// entities/category: rows must stay readable even if a category was
// somehow removed, so the key is just a non-empty string at this layer.
export type Category = string

// Amounts are always stored as positive numbers.
// Transaction type determines the cash-flow direction.
export interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  category: Category
  description: string
  account: string
}

// Accounts are plain text labels, not CRUD entities: the form suggests
// common ones but any label is valid. Rows written before accounts
// existed are migrated to this default on read.
export const DEFAULT_ACCOUNT = 'Checking Account'

export const ACCOUNT_SUGGESTIONS = [
  'Checking Account',
  'Cash',
  'Credit Card',
  'Savings',
] as const

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
}
