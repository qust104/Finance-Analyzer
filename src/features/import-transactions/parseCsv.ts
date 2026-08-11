export interface CsvRow {
  row: number
  cells: string[]
}

export interface CsvParseResult {
  headers: string[]
  rows: CsvRow[]
  structuralErrors: { row: number; message: string }[]
}

// A hand-written state machine instead of an external CSV library:
// the format is small and fully under our control, and it handles
// quoted fields, escaped quotes and CRLF line endings.
export function parseCsv(raw: string): CsvParseResult {
  const text = raw.replace(/\r\n/g, '\n')
  const records: { cells: string[]; fileRow: number }[] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false
  let fileRow = 1
  let index = 0

  const finishRecord = () => {
    record.push(field)
    records.push({ cells: record, fileRow })
    record = []
    field = ''
    fileRow += 1
  }

  while (index < text.length) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
      } else {
        field += char
      }
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      index += 1
      continue
    }
    if (char === ',') {
      record.push(field)
      field = ''
      index += 1
      continue
    }
    if (char === '\n') {
      finishRecord()
      index += 1
      continue
    }
    field += char
    index += 1
  }
  if (field !== '' || record.length > 0) {
    finishRecord()
  }

  if (records.length === 0) {
    return { headers: [], rows: [], structuralErrors: [] }
  }

  const headers = records[0].cells
  const rows = records
    .slice(1)
    .filter((entry) => !(entry.cells.length === 1 && entry.cells[0].trim() === ''))

  const structuralErrors = rows
    .filter((entry) => entry.cells.length !== headers.length)
    .map((entry) => ({
      row: entry.fileRow,
      message: `expected ${headers.length} columns, got ${entry.cells.length}`,
    }))

  return {
    headers,
    rows: rows.map((entry) => ({ row: entry.fileRow, cells: entry.cells })),
    structuralErrors,
  }
}
