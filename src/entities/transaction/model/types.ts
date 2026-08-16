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
}

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
}
