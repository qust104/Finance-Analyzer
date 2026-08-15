import { useMemo } from 'react'
import { resolveReportMonth } from '../../analytics/budgets'
import type { ReportMonth } from '../../analytics/budgets'
import type { Transaction } from '../../entities/transaction/model/types'

// One place decides the report month for every screen that shows one,
// so a change in policy (or its UI indicator) lands everywhere at once.
export function useReportMonth(transactions: readonly Transaction[]): ReportMonth {
  return useMemo(() => resolveReportMonth(transactions), [transactions])
}
