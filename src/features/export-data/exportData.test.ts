// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  buildExportPayload,
  downloadBackup,
  parseExportPayload,
} from './exportData'
import type { Budget } from '../../entities/budget/model/types'
import type { CategoryDef } from '../../entities/category/model/types'
import type { Transaction } from '../../entities/transaction/model/types'

const transactions: Transaction[] = [
  {
    id: 't1',
    date: '2026-08-01',
    amount: 150000,
    type: 'income',
    category: 'salary',
    description: 'Salary',
  },
]

const budgets: Budget[] = [{ id: 'b1', category: 'food', amount: 5000, period: 'monthly' }]

const categories: CategoryDef[] = [
  {
    key: 'hobbies',
    label: 'Hobbies',
    color: '#7c3aed',
    aliases: ['guitar'],
    builtin: false,
  },
]

describe('backup payload', () => {
  it('round-trips a valid payload', () => {
    const payload = buildExportPayload(
      transactions,
      budgets,
      categories,
      new Date('2026-08-16T10:00:00Z'),
    )
    const parsed = parseExportPayload(payload)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value).toEqual(payload)
  })

  it('round-trips a payload without a categories field', () => {
    const payload = buildExportPayload(transactions, budgets)
    const legacy: Record<string, unknown> = { ...payload }
    delete legacy.categories
    const parsed = parseExportPayload(legacy)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value).toEqual(payload)
  })

  it('rejects a payload with invalid category rows', () => {
    const payload = buildExportPayload(transactions, budgets)
    const parsed = parseExportPayload({
      ...payload,
      categories: [{ key: 'hobbies', label: 'Hobbies', aliases: [], builtin: false }],
    })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('invalid category')
  })

  it('rejects a payload with an unknown version', () => {
    const payload = buildExportPayload([], [])
    const parsed = parseExportPayload({ ...payload, version: 99 })

    expect(parsed.ok).toBe(false)
  })

  it('rejects a payload with an invalid transaction row', () => {
    const payload = buildExportPayload(transactions, budgets)
    const parsed = parseExportPayload({
      ...payload,
      transactions: [{ ...transactions[0], amount: -5 }],
    })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('invalid transaction')
  })

  it('rejects a payload with an invalid budget row', () => {
    const payload = buildExportPayload(transactions, budgets)
    const parsed = parseExportPayload({
      ...payload,
      budgets: [{ ...budgets[0], period: 'yearly' }],
    })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain('invalid budget')
  })

  it('rejects anything that is not an object', () => {
    expect(parseExportPayload('nope').ok).toBe(false)
    expect(parseExportPayload(null).ok).toBe(false)
  })

  it('downloads a JSON file through a temporary link', () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    vi.stubGlobal(
      'Blob',
      class BlobStub {
        parts: unknown[]
        options: unknown
        constructor(parts: unknown[], options: unknown) {
          this.parts = parts
          this.options = options
        }
      },
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    let createdLink: HTMLAnchorElement | undefined
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = originalCreateElement(tag)
      if (tag === 'a') createdLink = element as HTMLAnchorElement
      return element
    })

    downloadBackup(buildExportPayload([], []))

    expect(createObjectURL).toHaveBeenCalled()
    expect(createdLink?.download).toMatch(/^finance-analyzer-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
    click.mockRestore()
  })
})