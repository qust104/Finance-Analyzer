import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { CATEGORY_LABELS, TYPE_LABELS } from '../../entities/transaction/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import { formatAmount, formatDate } from '../../shared/lib/format'
import { Modal } from '../../shared/ui/Modal'
import { buildImportPreview } from './csvImport'
import type { ImportPreview } from './csvImport'
import './ImportTransactionsModal.css'
import '../../shared/ui/form.css'

interface ImportTransactionsModalProps {
  transactions: readonly Transaction[]
  onImport: (inputs: readonly TransactionInput[]) => void
  onClose: () => void
}

const PREVIEW_LIMIT = 10

export function ImportTransactionsModal({
  transactions,
  onImport,
  onClose,
}: ImportTransactionsModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    // Clearing the input lets the user re-pick the same file after an edit.
    event.target.value = ''
    setPreview(buildImportPreview(text, transactions))
  }

  const canImport = preview !== null && preview.fileErrors.length === 0 && preview.valid.length > 0

  return (
    <Modal title="Import transactions" onClose={onClose}>
      <div className="import">
        <p className="import__hint">
          Expected columns: <code>date, description, amount, type, category</code>
          <br />
          Example: <code>2026-08-01, Salary, 150000, income, salary</code>
        </p>

        <label className="button button--secondary import__picker">
          {preview === null ? 'Choose CSV file' : 'Choose another file'}
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="import__file-input"
          />
        </label>

        {preview !== null && (
          <>
            {preview.fileErrors.length > 0 ? (
              <div className="import__file-errors">
                <p className="import__file-errors-title">This file cannot be imported</p>
                <ul>
                  {preview.fileErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <PreviewTable
                preview={preview}
                canImport={canImport}
                onImport={() => onImport(preview.valid)}
                onClose={onClose}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

function PreviewTable({
  preview,
  canImport,
  onImport,
  onClose,
}: {
  preview: ImportPreview
  canImport: boolean
  onImport: () => void
  onClose: () => void
}) {
  const { valid, invalid, duplicates } = preview

  return (
    <div className="import__preview">
      <p className="import__summary">
        <strong>{valid.length}</strong> ready to import
        {invalid.length > 0 && (
          <>
            {' '}
            · <strong className="import__bad">{invalid.length}</strong> invalid
          </>
        )}
        {duplicates.length > 0 && (
          <>
            {' '}
            · <strong className="import__neutral">{duplicates.length}</strong> skipped as duplicates
          </>
        )}
      </p>

      <div className="import__actions">
        <button type="button" className="button button--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={!canImport}
          onClick={onImport}
        >
          Import {valid.length} transaction{valid.length === 1 ? '' : 's'}
        </button>
      </div>

      {valid.length > 0 && (
        <div className="import__table-wrap">
          <table className="import__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {valid.slice(0, PREVIEW_LIMIT).map((transaction) => (
                <tr key={`${transaction.date}-${transaction.description}-${transaction.amount}`}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td>{CATEGORY_LABELS[transaction.category]}</td>
                  <td>{TYPE_LABELS[transaction.type]}</td>
                  <td>{formatAmount(transaction.amount, transaction.type)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {valid.length > PREVIEW_LIMIT && (
            <p className="import__more">⋯ and {valid.length - PREVIEW_LIMIT} more</p>
          )}
        </div>
      )}

      {invalid.length > 0 && (
        <div className="import__issues">
          <p className="import__issues-title">Rows that will not be imported:</p>
          <ul className="import__issues-list">
            {invalid.map((row) => (
              <li key={row.row}>
                Row {row.row}: {row.errors.join('; ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
