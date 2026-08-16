import { describe, expect, it } from 'vitest'
import { transactionSchema } from './transactionSchema'

describe('transactionSchema', () => {
  const validValues = {
    date: '2026-08-01',
    description: 'Pyaterochka',
    amount: '2340',
    type: 'expense',
    category: 'food',
  }

  it('accepts valid string form values and coerces the amount', () => {
    const result = transactionSchema.safeParse(validValues)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(2340)
    }
  })

  it('rejects a malformed date', () => {
    const result = transactionSchema.safeParse({ ...validValues, date: '01.08.2026' })

    expect(result.success).toBe(false)
  })

  it('rejects an empty description', () => {
    const result = transactionSchema.safeParse({ ...validValues, description: '' })

    expect(result.success).toBe(false)
  })

  it('rejects zero, negative and non-numeric amounts', () => {
    for (const amount of ['0', '-10', 'abc', '']) {
      const result = transactionSchema.safeParse({ ...validValues, amount })
      expect(result.success).toBe(false)
    }
  })

  it('rejects amounts finer than the cent', () => {
    for (const amount of ['0.001', '12.345', '0.99999']) {
      const result = transactionSchema.safeParse({ ...validValues, amount })
      expect(result.success).toBe(false)
    }
  })

  it('accepts amounts with up to two decimal places', () => {
    for (const amount of ['0.01', '12.34', '99.99']) {
      const result = transactionSchema.safeParse({ ...validValues, amount })
      expect(result.success).toBe(true)
    }
  })

  it('accepts a numeric amount directly (API contract)', () => {
    const result = transactionSchema.safeParse({ ...validValues, amount: 2340.5 })

    expect(result.success).toBe(true)
  })

  it('accepts any non-empty category (the catalogue is user-extendable)', () => {
    const result = transactionSchema.safeParse({ ...validValues, category: 'crypto' })

    expect(result.success).toBe(true)
  })

  it('rejects an empty category', () => {
    const result = transactionSchema.safeParse({ ...validValues, category: '' })

    expect(result.success).toBe(false)
  })

  it('rejects an unknown type', () => {
    const result = transactionSchema.safeParse({ ...validValues, type: 'transfer' })

    expect(result.success).toBe(false)
  })
})
