import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../entities/transaction/model/types'
import {
  MAX_IMPORT_ROWS,
  buildImportPreview,
  normalizeCsvRow,
  parseCsvAmount,
  parseCsvCategory,
  parseCsvDate,
  parseCsvType,
  transactionFingerprint,
} from './csvImport'
import { parseCsv } from './parseCsv'

const HEADERS = ['date', 'description', 'amount', 'type', 'category']

describe('parseCsv', () => {
  it('parses a simple table', () => {
    const result = parseCsv(
      'date,description,amount,type,category\n2026-08-01,Salary,150000,income,salary',
    )

    expect(result.headers).toEqual(HEADERS)
    expect(result.rows).toEqual([
      { row: 2, cells: ['2026-08-01', 'Salary', '150000', 'income', 'salary'] },
    ])
    expect(result.structuralErrors).toEqual([])
  })

  it('handles quoted fields containing commas', () => {
    const result = parseCsv('description,amount\n"Pyaterochka, 24",2340')

    expect(result.rows[0]?.cells).toEqual(['Pyaterochka, 24', '2340'])
  })

  it('handles escaped quotes inside quoted fields', () => {
    const result = parseCsv('description\n"She said ""hi"" today"')

    expect(result.rows[0]?.cells).toEqual(['She said "hi" today'])
  })

  it('handles line breaks inside quoted fields', () => {
    const result = parseCsv('description\n"multi\nline"')

    expect(result.rows[0]?.cells).toEqual(['multi\nline'])
  })

  it('handles Windows line endings', () => {
    const result = parseCsv('a,b\r\n1,2\r\n3,4')

    expect(result.rows).toEqual([
      { row: 2, cells: ['1', '2'] },
      { row: 3, cells: ['3', '4'] },
    ])
  })

  it('ignores trailing and blank lines', () => {
    const result = parseCsv('a,b\n1,2\n\n\n')

    expect(result.rows).toEqual([{ row: 2, cells: ['1', '2'] }])
  })

  it('returns rows with file line numbers', () => {
    const result = parseCsv('a,b,c\n1,2,3\n4,5,6')

    expect(result.rows.map((row) => row.row)).toEqual([2, 3])
  })

  it('reports rows with the wrong column count', () => {
    const result = parseCsv('a,b\n1,2,3\n4')

    expect(result.structuralErrors).toEqual([
      { row: 2, message: 'expected 2 columns, got 3' },
      { row: 3, message: 'expected 2 columns, got 1' },
    ])
  })

  it('returns empty headers for an empty file', () => {
    const result = parseCsv('')

    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })
})

describe('parseCsvAmount', () => {
  it('parses decimal separators', () => {
    expect(parseCsvAmount('2340')).toBe(2340)
    expect(parseCsvAmount('2340.50')).toBe(2340.5)
    expect(parseCsvAmount('2340,50')).toBe(2340.5)
    expect(parseCsvAmount('2 340,50')).toBe(2340.5)
  })

  it('rejects zero, negatives and garbage', () => {
    expect(parseCsvAmount('0')).toBeNull()
    expect(parseCsvAmount('-10')).toBeNull()
    expect(parseCsvAmount('abc')).toBeNull()
    expect(parseCsvAmount('')).toBeNull()
  })
})

describe('parseCsvDate', () => {
  it('accepts only real ISO dates', () => {
    expect(parseCsvDate('2026-08-01')).toBe('2026-08-01')
    expect(parseCsvDate('2026-02-30')).toBeNull()
    expect(parseCsvDate('01.08.2026')).toBeNull()
    expect(parseCsvDate('2026-8-1')).toBeNull()
    expect(parseCsvDate('garbage')).toBeNull()
  })
})

describe('parseCsvType', () => {
  it('normalizes case', () => {
    expect(parseCsvType('income')).toBe('income')
    expect(parseCsvType('INCOME')).toBe('income')
    expect(parseCsvType(' Expense ')).toBe('expense')
  })

  it('rejects unknown types', () => {
    expect(parseCsvType('transfer')).toBeNull()
    expect(parseCsvType('')).toBeNull()
  })
})

describe('parseCsvCategory', () => {
  it('normalizes canonical values', () => {
    expect(parseCsvCategory('food')).toBe('food')
    expect(parseCsvCategory('FOOD')).toBe('food')
  })

  it('maps aliases', () => {
    expect(parseCsvCategory('еда')).toBe('food')
    expect(parseCsvCategory('groceries')).toBe('food')
    expect(parseCsvCategory('жильё')).toBe('housing')
    expect(parseCsvCategory('развлечения')).toBe('entertainment')
  })

  it('rejects unknown categories', () => {
    expect(parseCsvCategory('crypto')).toBeNull()
    expect(parseCsvCategory('')).toBeNull()
  })
})

describe('normalizeCsvRow', () => {
  it('builds a valid transaction input', () => {
    const result = normalizeCsvRow(['2026-08-01', 'Salary', '150000', 'income', 'salary'], HEADERS)

    expect(result).toEqual({
      ok: true,
      value: {
        date: '2026-08-01',
        description: 'Salary',
        amount: 150000,
        type: 'income',
        category: 'salary',
      },
    })
  })

  it('collects all errors for a broken row', () => {
    const result = normalizeCsvRow(['2026-02-30', '', '0', 'transfer', 'crypto'], HEADERS)

    expect(result).toEqual({
      ok: false,
      errors: [
        'Invalid date "2026-02-30", expected YYYY-MM-DD',
        'Amount must be a positive number',
        'Type must be "income" or "expense"',
        'Unknown category',
        'Description is required',
      ],
    })
  })

  it('works when headers are not in canonical order', () => {
    const result = normalizeCsvRow(
      ['150000', 'salary', 'Salary', 'income', '2026-08-01'],
      ['amount', 'category', 'description', 'type', 'date'],
    )

    expect(result).toEqual({
      ok: true,
      value: {
        date: '2026-08-01',
        description: 'Salary',
        amount: 150000,
        type: 'income',
        category: 'salary',
      },
    })
  })
})

describe('transactionFingerprint', () => {
  it('is case-insensitive for descriptions', () => {
    expect(
      transactionFingerprint({ date: '2026-08-01', amount: 2340, description: 'Pyaterochka' }),
    ).toBe(transactionFingerprint({ date: '2026-08-01', amount: 2340, description: 'pyaterochka' }))
  })
})

describe('buildImportPreview', () => {
  const existing: Transaction[] = [
    {
      id: '1',
      date: '2026-08-01',
      amount: 150000,
      type: 'income',
      category: 'salary',
      description: 'Salary',
    },
  ]

  it('splits rows into valid, invalid and duplicates', () => {
    const text = [
      'date,description,amount,type,category',
      '2026-08-01,Salary,150000,income,salary',
      '2026-08-02,Pyaterochka,2340,expense,food',
      '2026-08-03,Broken,0,expense,unknown',
      '2026-08-02,Pyaterochka,2340,expense,food',
    ].join('\n')

    const preview = buildImportPreview(text, existing)

    // Salary already exists locally, so the file copy is a duplicate,
    // while both Pyaterochka rows are legitimate purchases.
    expect(preview.valid).toHaveLength(2)
    expect(preview.valid.map((row) => row.description)).toEqual(['Pyaterochka', 'Pyaterochka'])
    expect(preview.duplicates).toEqual([2])
    expect(preview.invalid).toEqual([
      { row: 4, errors: ['Amount must be a positive number', 'Unknown category'] },
    ])
    expect(preview.fileErrors).toEqual([])
  })

  it('flags missing required columns', () => {
    const preview = buildImportPreview('date,description\n2026-08-01,Salary', [])

    expect(preview.fileErrors).toEqual(['Missing columns: amount, type, category'])
    expect(preview.valid).toEqual([])
  })

  it('flags an empty file', () => {
    const preview = buildImportPreview('', [])

    expect(preview.fileErrors).toEqual(['The file is empty or has no header row'])
  })

  it('imports legitimate identical rows within one file', () => {
    const text = [
      'date,description,amount,type,category',
      '2026-08-01,A,10,expense,food',
      '2026-08-01,A,10,expense,food',
    ].join('\n')

    const preview = buildImportPreview(text, [])

    expect(preview.valid).toHaveLength(2)
    expect(preview.duplicates).toEqual([])
  })

  it('flags a re-import of the same file as duplicates', () => {
    const text = [
      'date,description,amount,type,category',
      '2026-08-01,A,10,expense,food',
      '2026-08-01,A,10,expense,food',
    ].join('\n')

    const alreadyImported: Transaction[] = [
      {
        id: '1',
        date: '2026-08-01',
        amount: 10,
        type: 'expense',
        category: 'food',
        description: 'A',
      },
      {
        id: '2',
        date: '2026-08-01',
        amount: 10,
        type: 'expense',
        category: 'food',
        description: 'A',
      },
    ]

    const preview = buildImportPreview(text, alreadyImported)

    expect(preview.valid).toEqual([])
    expect(preview.duplicates).toEqual([2, 3])
  })

  it('rejects files with too many rows', () => {
    const text = [
      'date,description,amount,type,category',
      ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => '2026-08-01,A,10,expense,food'),
    ].join('\n')

    const preview = buildImportPreview(text, [])

    expect(preview.fileErrors).toEqual([
      `The file has too many rows. Maximum is ${MAX_IMPORT_ROWS} rows.`,
    ])
    expect(preview.valid).toEqual([])
  })
})
