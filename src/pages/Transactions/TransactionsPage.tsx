import { useCallback, useMemo } from 'react'
import type { TransactionInput } from '../../entities/transaction/model/repository'
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
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useTransactionFilters } from '../../shared/hooks/useTransactionFilters'
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
  const { filters, updateFilters, resetFilters } = useTransactionFilters()
  const editing = useUiStore((state) => state.transactionForm)
  const openTransactionForm = useUiStore((state) => state.openTransactionForm)
  const closeTransactionForm = useUiStore((state) => state.closeTransactionForm)
  const importOpen = useUiStore((state) => state.importOpen)
  const openImportModal = useUiStore((state) => state.openImportModal)
  const closeImportModal = useUiStore((state) => state.closeImportModal)

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
          <button type="button" className="button button--secondary" onClick={openImportModal}>
            Import CSV
          </button>
          <button
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
            onEdit={openTransactionForm}
            onDelete={removeTransaction}
          />
          <ul className="transaction-cards">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="transaction-cards__item">
                <TransactionCard
                  transaction={transaction}
                  onEdit={openTransactionForm}
                  onDelete={removeTransaction}
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
          importState={importState}
          onImport={handleImport}
          onClose={closeImportModal}
        />
      )}
    </section>
  )
}
