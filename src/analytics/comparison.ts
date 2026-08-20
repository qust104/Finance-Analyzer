import type { Transaction } from '../entities/transaction/model/types'
import {
  calculateAverageDailySpending,
  calculateSavings,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
  daysElapsedInMonth,
  daysInMonth,
} from './calculations'

export type ComparisonMetric = 'income' | 'expenses' | 'savings' | 'savingsRate'

export interface MetricComparison {
  current: number
  previous: number | null
  // Relative change in % for currency sums; null when there is no
  // previous data to compare against (or for rates, see changePoints).
  changePercent: number | null
  // Percentage-point change for the savings rate (e.g. 5.0 means the
  // rate moved five points), null for currency sums.
  changePoints: number | null
}

export function previousMonthKey(month: string): string | null {
  const [year, index] = month.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(index) || index < 1 || index > 12) {
    return null
  }
  const shifted = index === 1 ? { year: year - 1, index: 12 } : { year, index: index - 1 }
  return `${shifted.year}-${String(shifted.index).padStart(2, '0')}`
}

function rowsForMonth(transactions: readonly Transaction[], month: string): Transaction[] {
  return transactions.filter((transaction) => transaction.date.startsWith(month))
}

function pickMetric(
  metric: Exclude<ComparisonMetric, 'savingsRate'>,
): (rows: readonly Transaction[]) => number {
  if (metric === 'income') return calculateTotalIncome
  if (metric === 'expenses') return calculateTotalExpenses
  return calculateSavings
}

// Month-over-month metric comparison. Currency sums are compared in
// relative percent, the savings rate in percentage points. previous
// and the *Change fields are null when the previous month has no data,
// so the UI can say "no data" instead of inventing a 0%.
export function compareMonthMetric(
  transactions: readonly Transaction[],
  month: string,
  metric: ComparisonMetric,
): MetricComparison {
  const nullPrevious = { previous: null, changePercent: null, changePoints: null }

  if (metric === 'savingsRate') {
    const current = calculateSavingsRate(rowsForMonth(transactions, month))
    const previousKey = previousMonthKey(month)
    const previousRows = previousKey === null ? [] : rowsForMonth(transactions, previousKey)
    if (previousRows.length === 0) {
      return { current, ...nullPrevious }
    }
    const previous = calculateSavingsRate(previousRows)
    const changePoints = Math.round((current - previous) * 10) / 10
    return { current, ...nullPrevious, previous, changePoints }
  }

  const pick = pickMetric(metric)
  const current = pick(rowsForMonth(transactions, month))
  const previousKey = previousMonthKey(month)
  const previousRows = previousKey === null ? [] : rowsForMonth(transactions, previousKey)
  if (previousRows.length === 0) {
    return { current, ...nullPrevious }
  }
  const previous = pick(previousRows)
  const changePercent =
    previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10
  return { current, previous, changePercent, changePoints: null }
}

// Average daily spending compares the same slice of both months: when
// the selected month is still running (say, August 20), it compares
// August 1-20 against July 1-20, not against the whole of July.
export function compareAverageDailySpending(
  transactions: readonly Transaction[],
  month: string,
  today: string,
): MetricComparison {
  const nullPrevious = { previous: null, changePercent: null, changePoints: null }
  const current = calculateAverageDailySpending(transactions, month, today)

  const previousKey = previousMonthKey(month)
  if (previousKey === null) {
    return { current, ...nullPrevious }
  }
  const previousRows = rowsForMonth(transactions, previousKey)
  if (previousRows.length === 0) {
    return { current, ...nullPrevious }
  }

  const elapsed = daysElapsedInMonth(month, today)
  const slice =
    elapsed === null
      ? previousRows
      : previousRows.filter((row) => Number(row.date.slice(8, 10)) <= elapsed)
  if (slice.length === 0) {
    return { current, ...nullPrevious }
  }

  const previousExpenses = calculateTotalExpenses(slice)
  const previousDays = elapsed === null ? daysInMonth(previousKey) : elapsed
  const previous = previousExpenses === 0 ? 0 : Math.round(previousExpenses / previousDays)
  const changePercent =
    previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10
  return { current, previous, changePercent, changePoints: null }
}