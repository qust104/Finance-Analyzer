import { describe, expect, it } from 'vitest'
import type { RecurringDef } from '../../entities/recurring/model/types'
import {
  MAX_RECURRING_BACKFILL,
  computeRecurringPlan,
  nextScheduledDate,
  scheduledDates,
  upcomingScheduledDate,
} from './schedule'

function template(overrides: Partial<RecurringDef> = {}): RecurringDef {
  return {
    id: 'r1',
    description: 'Rent',
    amount: 25000,
    type: 'expense',
    category: 'housing',
    interval: 'monthly',
    startDate: '2026-01-05',
    endDate: null,
    active: true,
    lastPostedDate: null,
    ...overrides,
  }
}

describe('nextScheduledDate', () => {
  it('adds a week for weekly templates', () => {
    expect(nextScheduledDate(template({ interval: 'weekly' }), '2026-01-05')).toBe('2026-01-12')
  })

  it('adds a month keeping the anchor day', () => {
    expect(nextScheduledDate(template(), '2026-01-05')).toBe('2026-02-05')
  })

  it('clamps the 31st to the month length', () => {
    const jan31 = template({ startDate: '2026-01-31' })
    expect(nextScheduledDate(jan31, '2026-01-31')).toBe('2026-02-28')
    expect(nextScheduledDate(jan31, '2026-02-28')).toBe('2026-03-31')
  })

  it('adds a year keeping the anchor month and day', () => {
    const yearly = template({ interval: 'yearly', startDate: '2026-07-15' })
    expect(nextScheduledDate(yearly, '2026-07-15')).toBe('2027-07-15')
  })
})

describe('scheduledDates', () => {
  it('returns every occurrence from the start to today', () => {
    expect(scheduledDates(template(), '2026-03-05')).toEqual([
      '2026-01-05',
      '2026-02-05',
      '2026-03-05',
    ])
  })

  it('stops at the end date', () => {
    expect(scheduledDates(template({ endDate: '2026-02-10' }), '2026-06-05')).toEqual([
      '2026-01-05',
      '2026-02-05',
    ])
  })

  it('is empty when the start is in the future', () => {
    expect(scheduledDates(template({ startDate: '2027-01-05' }), '2026-03-05')).toEqual([])
  })
})

describe('upcomingScheduledDate', () => {
  it('returns the first occurrence after a date', () => {
    expect(upcomingScheduledDate(template(), '2026-03-10')).toBe('2026-04-05')
  })

  it('returns null after the end date', () => {
    expect(upcomingScheduledDate(template({ endDate: '2026-02-28' }), '2026-03-10')).toBeNull()
  })
})

describe('computeRecurringPlan', () => {
  const existing = [
    {
      id: 't1',
      date: '2026-01-05',
      amount: 25000,
      type: 'expense' as const,
      category: 'housing',
      description: 'Rent',
    },
  ]

  it('creates due rows and advances the template', () => {
    const plan = computeRecurringPlan([template()], existing, '2026-03-05')

    expect(plan.toCreate.map((row) => row.date)).toEqual(['2026-02-05', '2026-03-05'])
    expect(plan.advances).toEqual([{ id: 'r1', lastPostedDate: '2026-03-05' }])
  })

  it('skips rows whose fingerprint already exists', () => {
    const plan = computeRecurringPlan([template()], existing, '2026-01-05')

    expect(plan.toCreate).toEqual([])
    expect(plan.advances).toEqual([{ id: 'r1', lastPostedDate: '2026-01-05' }])
  })

  it('creates nothing beyond the last posted date', () => {
    const plan = computeRecurringPlan(
      [template({ lastPostedDate: '2026-02-05' })],
      [],
      '2026-02-10',
    )

    expect(plan.toCreate).toEqual([])
    expect(plan.advances).toEqual([])
  })

  it('respects the backfill limit for abandoned templates', () => {
    const starts = template({ startDate: '2020-01-05' })
    const plan = computeRecurringPlan([starts], [], '2026-03-05')

    expect(plan.toCreate).toHaveLength(MAX_RECURRING_BACKFILL)
    expect(plan.advances[0]?.lastPostedDate).toBe('2026-03-05')
  })

  it('ignores paused templates', () => {
    const plan = computeRecurringPlan([template({ active: false })], existing, '2026-03-05')

    expect(plan.toCreate).toEqual([])
    expect(plan.advances).toEqual([])
  })
})