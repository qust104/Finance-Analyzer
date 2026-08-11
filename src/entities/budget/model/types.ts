import type { Category } from '../../transaction/model/types'

export interface Budget {
  id: string
  category: Category
  amount: number
  period: 'monthly'
}

export interface BudgetInput {
  category: Category
  amount: number
  period: 'monthly'
}
