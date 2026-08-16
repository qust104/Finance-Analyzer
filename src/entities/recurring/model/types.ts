import type { Category, TransactionType } from '../../transaction/model/types'

export type RecurringInterval = 'weekly' | 'monthly' | 'yearly'

// A template that generates real transactions on a schedule. The
// engine advances `lastPostedDate` after every run, so a week that
// was already turned into transactions never creates duplicates.
export interface RecurringDef {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: Category
  interval: RecurringInterval
  startDate: string
  endDate: string | null
  active: boolean
  lastPostedDate: string | null
}

export type RecurringInput = Omit<RecurringDef, 'id' | 'lastPostedDate'>

export const RECURRING_INTERVALS: readonly RecurringInterval[] = [
  'weekly',
  'monthly',
  'yearly',
]