import type { RecurringDef } from '../../entities/recurring/model/types'
import { transactionFingerprint } from '../import-transactions/csvImport'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import type { Transaction } from '../../entities/transaction/model/types'

// A fresh template found years of due periods would flood the ledger
// with backdated rows; the generator creates only the most recent
// batches and treats older periods as lost history.
export const MAX_RECURRING_BACKFILL = 24

export interface RecurringPlan {
  toCreate: TransactionInput[]
  advances: { id: string; lastPostedDate: string }[]
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Month is 1-based; returns the number of days in it.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// The next occurrence of the interval carrying `current` forward by
// exactly one period, or null when the interval cannot progress
// (defensive, never happens with the schema's enum).
export function nextScheduledDate(template: RecurringDef, current: string): string | null {
  const [year, month, day] = current.split('-').map(Number)
  const anchor = parseDate(template.startDate)
  const anchorDay = anchor.getDate()
  switch (template.interval) {
    case 'weekly': {
      const next = new Date(year, month - 1, day + 7)
      return formatDate(next)
    }
    case 'monthly': {
      const nextMonth = month // 0-based month of the next occurrence
      const lastDay = daysInMonth(year, nextMonth + 1)
      const next = new Date(year, nextMonth, Math.min(anchorDay, lastDay))
      return formatDate(next)
    }
    case 'yearly': {
      const anchorMonth = anchor.getMonth() + 1
      const lastDay = daysInMonth(year + 1, anchorMonth)
      const next = new Date(year + 1, anchorMonth - 1, Math.min(anchorDay, lastDay))
      return formatDate(next)
    }
  }
}

// Every occurrence from the start date up to and including `today`,
// constrained by an optional end date. Iteration is bounded so a
// malformed template can never hang the generator.
export function scheduledDates(template: RecurringDef, today: string): string[] {
  const dates: string[] = []
  let cursor = template.startDate
  let guard = 0
  while (cursor <= today && guard < 5000 && (template.endDate === null || cursor <= template.endDate)) {
    dates.push(cursor)
    const next = nextScheduledDate(template, cursor)
    if (next === null || next <= cursor) break
    cursor = next
    guard++
  }
  return dates
}

// The first upcoming occurrence after `after` (for the UI's "next" hint),
// or null when the template ended or cannot progress.
export function upcomingScheduledDate(template: RecurringDef, after: string): string | null {
  let cursor = template.startDate
  while (cursor <= after) {
    const next = nextScheduledDate(template, cursor)
    if (next === null || next <= cursor) return null
    cursor = next
  }
  if (template.endDate !== null && cursor > template.endDate) return null
  return cursor
}

// What the generator must do for every active template: create the
// backdated rows the account still lacks (matched by fingerprint) and
// move `lastPostedDate` forward over every processed occurrence.
export function computeRecurringPlan(
  recurring: readonly RecurringDef[],
  existing: readonly Transaction[],
  today: string,
): RecurringPlan {
  const toCreate: TransactionInput[] = []
  const advances: { id: string; lastPostedDate: string }[] = []
  const existingFingerprints = new Set(existing.map(transactionFingerprint))

  for (const template of recurring) {
    if (!template.active) continue

    const dates = scheduledDates(template, today)
    if (dates.length > MAX_RECURRING_BACKFILL) {
      dates.splice(0, dates.length - MAX_RECURRING_BACKFILL)
    }

    let processed = template.lastPostedDate
    for (const date of dates) {
      if (processed !== null && date <= processed) continue
      const fingerprint = transactionFingerprint({ date, amount: template.amount, description: template.description })
      if (!existingFingerprints.has(fingerprint)) {
        toCreate.push({
          date,
          amount: template.amount,
          type: template.type,
          category: template.category,
          description: template.description,
        })
      }
      processed = date
    }

    if (processed !== null && processed !== template.lastPostedDate) {
      advances.push({ id: template.id, lastPostedDate: processed })
    }
  }

  return { toCreate, advances }
}