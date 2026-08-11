import { useState } from 'react'
import type { Transaction } from '../../entities/transaction/model/types'
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
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useTransactionFilters } from '../../shared/hooks/useTransactionFilters'
import './TransactionsPage.css'
import '../../shared/ui/form.css'

export function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, removeTransaction } = useTransactions()
  const { filters, updateFilters, resetFilters } = useTransactionFilters()
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)

  const filteredTransactions = applyFilters(transactions, filters)
  const months = getAvailableMonths(transactions)

  const handleSubmit = (input: TransactionInput) => {
    if (editing === 'new') {
      addTransaction(input)
    } else if (editing) {
      updateTransaction(editing.id, input)
    }
    setEditing(null)
  }

  const matchesNothing = transactions.length > 0 && filteredTransactions.length === 0

  return (
    <section>
      <div className="transactions-header">
        <h1 className="page-title">Transactions</h1>
        <button type="button" className="button button--primary" onClick={() => setEditing('new')}>
          Add transaction
        </button>
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
            onClick={() => setEditing('new')}
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
            onEdit={setEditing}
            onDelete={removeTransaction}
          />
          <ul className="transaction-cards">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="transaction-cards__item">
                <TransactionCard
                  transaction={transaction}
                  onEdit={setEditing}
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
          onClose={() => setEditing(null)}
        >
          <TransactionForm
            initialValue={editing === 'new' ? undefined : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </section>
  )
}
