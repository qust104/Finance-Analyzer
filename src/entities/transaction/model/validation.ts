import type { Category, TransactionType } from './types'

// Raw form values: inputs always produce strings.
export interface TransactionFormValues {
  type: TransactionType
  amount: string
  description: string
  category: Category | ''
  date: string
}

export type TransactionFormErrors = Partial<Record<keyof TransactionFormValues, string>>

export function validateTransactionForm(values: TransactionFormValues): TransactionFormErrors {
  const errors: TransactionFormErrors = {}

  const amount = Number(values.amount)
  if (values.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number'
  }

  if (values.description.trim() === '') {
    errors.description = 'Description is required'
  }

  if (values.category === '') {
    errors.category = 'Category is required'
  }

  if (values.date === '') {
    errors.date = 'Date is required'
  }

  return errors
}
