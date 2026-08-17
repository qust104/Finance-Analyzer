import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import { buildImportPreview, MAX_IMPORT_BYTES } from '../../features/import-transactions/csvImport'
import type { ImportPreview } from '../../features/import-transactions/csvImport'
import {
  applyFilters,
  getAvailableMonths,
  hasActiveFilters,
} from '../../entities/transaction/model/filters'
import { TransactionForm } from '../../entities/transaction/ui/TransactionForm'
import { TransactionCard } from '../../entities/transaction/ui/TransactionCard'
import { TransactionFilters } from '../../entities/transaction/ui/TransactionFilters'
import { TransactionList } from '../../entities/transaction/ui/TransactionList'
import { Modal } from '../../shared/ui/Modal'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { Toast } from '../../shared/ui/Toast'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useTransactionFilters } from '../../shared/hooks/useTransactionFilters'
import { useUndoableDelete } from '../../shared/hooks/useUndoableDelete'
import { useCategories } from '../../shared/hooks/useCategories'
import { useUiStore } from '../../shared/store/uiStore'
import { ImportTransactionsModal } from '../../features/import-transactions/ImportTransactionsModal'
import './TransactionsPage.css'
import '../../shared/ui/form.css'

export function TransactionsPage() {
  const {
    transactions,
    addTransaction,
    addTransactions,
    updateTransaction,
    removeTransaction,
    isPending,
    isError,
    refetch,
    saveState,
    importState,
  } = useTransactions()
  const { categories } = useCategories()
  const { filters, updateFilters, resetFilters } = useTransactionFilters()
  const { requestDelete, restorePending, clearUndo, pendingUndo } = useUndoableDelete({
    message: 'Transaction deleted',
    remove: removeTransaction,
    find: (id) => transactions.find((transaction) => transaction.id === id),
    restore: (transaction) =>
      addTransaction({
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
      }),
  })
  const editing = useUiStore((state) => state.transactionForm)
  const openTransactionForm = useUiStore((state) => state.openTransactionForm)
  const closeTransactionForm = useUiStore((state) => state.closeTransactionForm)
  const importOpen = useUiStore((state) => state.importOpen)
  const openImportModal = useUiStore((state) => state.openImportModal)
  const closeImportModal = useUiStore((state) => state.closeImportModal)

  // Preview prebuilt for a file dropped onto the page; the modal consumes
  // it on mount. null keeps the classic picker-only flow.
  const [importPreset, setImportPreset] = useState<ImportPreview | null>(null)
  const [dragDepth, setDragDepth] = useState(0)

  const handleDropFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_BYTES) {
        setImportPreset({
          valid: [],
          invalid: [],
          duplicates: [],
          fileErrors: ['The file is too large. Maximum size is 5 MB.'],
        })
        openImportModal()
        return
      }
      const text = await file.text()
      setImportPreset(buildImportPreview(text, transactions, categories))
      openImportModal()
    },
    [transactions, categories, openImportModal],
  )

  useEffect(() => {
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false
    const onDragEnter = (event: DragEvent) => {
      if (hasFiles(event)) {
        event.preventDefault()
        setDragDepth((depth) => depth + 1)
      }
    }
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) {
        // Without preventDefault the browser refuses to drop.
        event.preventDefault()
      }
    }
    const onDragLeave = (event: DragEvent) => {
      if (hasFiles(event)) {
        setDragDepth((depth) => Math.max(0, depth - 1))
      }
    }
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return
      }
      event.preventDefault()
      setDragDepth(0)
      const file = event.dataTransfer?.files[0]
      if (file) {
        void handleDropFile(file)
      }
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [handleDropFile])

  // Filtering runs on every keystroke of the search input: memoize the
  // result so only the visible rows re-render, not the whole table.
  const filteredTransactions = useMemo(
    () => applyFilters(transactions, filters),
    [transactions, filters],
  )
  const months = useMemo(() => getAvailableMonths(transactions), [transactions])

  const handleSubmit = useCallback(
    async (input: TransactionInput) => {
      try {
        if (editing === 'new') {
          await addTransaction(input)
        } else if (editing) {
          await updateTransaction(editing.id, input)
        }
        closeTransactionForm()
      } catch {
        // saveState.error explains the failure, the form stays open.
      }
    },
    [editing, addTransaction, updateTransaction, closeTransactionForm],
  )

  const handleImport = useCallback(
    async (inputs: readonly TransactionInput[]) => {
      try {
        await addTransactions(inputs)
        closeImportModal()
      } catch {
        // A partial batch failure keeps the modal open: importState.error
        // is shown there, and retrying rebuilds the preview so already
        // committed rows are skipped as duplicates.
      }
    },
    [addTransactions, closeImportModal],
  )

  const matchesNothing = transactions.length > 0 && filteredTransactions.length === 0

  // Arriving from the command palette (?highlight=<id>): make sure the
  // row is reachable (clear active filters) and bring it into view.
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const hasHighlight = highlightId !== null

  useEffect(() => {
    if (!hasHighlight) {
      return
    }
    if (hasActiveFilters(filters)) {
      // Keep the highlight param while clearing the filters.
      const params = new URLSearchParams(searchParams)
      for (const key of ['q', 'category', 'type', 'month', 'from', 'to', 'min', 'max'] as const) {
        params.delete(key)
      }
      setSearchParams(params, { replace: true })
      return
    }
    const frame = requestAnimationFrame(() => {
      const row = document.querySelector(`tr[data-transaction-id="${highlightId}"]`)
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [hasHighlight, highlightId, filters, searchParams, setSearchParams])

  if (isPending) {
    return (
      <section>
        <h1 className="page-title">Transactions</h1>
        <LoadingState />
      </section>
    )
  }

  if (isError && transactions.length === 0) {
    return (
      <section>
        <h1 className="page-title">Transactions</h1>
        <ErrorState onRetry={refetch} />
      </section>
    )
  }

  return (
    <section>
      <div className="transactions-header">
        <h1 className="page-title">Transactions</h1>
        <div className="transactions-header__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setImportPreset(null)
              openImportModal()
            }}
          >
            Import CSV
          </button>          <button
            type="button"
            className="button button--primary"
            onClick={() => openTransactionForm('new')}
          >
            Add transaction
          </button>
        </div>
      </div>

      <TransactionFilters
        filters={filters}
        months={months}
        categories={categories}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No transactions yet</p>
          <p className="empty-state__hint">
            Add your first transaction to start tracking your finances.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => openTransactionForm('new')}
          >
            Add transaction
          </button>
        </div>
      ) : matchesNothing ? (
        <div className="empty-state">
          <p className="empty-state__title">No transactions match your filters</p>
          {hasActiveFilters(filters) && (
            <button type="button" className="button button--secondary" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <>
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            onEdit={openTransactionForm}
            onDelete={requestDelete}
            highlightId={highlightId}
          />
          <ul className="transaction-cards">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="transaction-cards__item">
                <TransactionCard
                  transaction={transaction}
                  categories={categories}
                  onEdit={openTransactionForm}
                  onDelete={requestDelete}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {editing !== null && (
        <Modal
          title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}
          onClose={closeTransactionForm}
        >
          <TransactionForm
            initialValue={editing === 'new' ? undefined : editing}
            categories={categories}
            submitError={saveState.error}
            isSubmitting={saveState.isPending}
            onSubmit={handleSubmit}
            onCancel={closeTransactionForm}
          />
        </Modal>
      )}

      {importOpen && (
        <ImportTransactionsModal
          transactions={transactions}
          categories={categories}
          importState={importState}
          onImport={handleImport}
          onClose={closeImportModal}
          importPreset={importPreset}
        />
      )}

      {dragDepth > 0 && (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-overlay__inner">
            <p className="drop-overlay__title">Drop your CSV file</p>
            <p className="drop-overlay__hint">Release to open the import preview</p>
          </div>
        </div>
      )}

      {pendingUndo !== null && (
        <Toast
          message={pendingUndo.message}
          onUndo={() => restorePending(pendingUndo.item)}
          onClose={clearUndo}
        />
      )}
    </section>
  )
}
