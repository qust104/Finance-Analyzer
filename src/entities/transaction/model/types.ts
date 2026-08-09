export type TransactionType = 'income' | 'expense'

export type Category =
  'salary' | 'food' | 'transport' | 'shopping' | 'entertainment' | 'health' | 'housing' | 'other'

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

export const ALL_CATEGORIES = [
  'salary',
  'food',
  'transport',
  'shopping',
  'entertainment',
  'health',
  'housing',
  'other',
] as const satisfies readonly Category[]

export const CATEGORY_LABELS: Record<Category, string> = {
  salary: 'Salary',
  food: 'Food',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health: 'Health',
  housing: 'Housing',
  other: 'Other',
}
