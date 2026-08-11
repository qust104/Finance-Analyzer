import { memo } from 'react'
import type { Transaction } from '../model/types'
import { CATEGORY_LABELS, TYPE_LABELS } from '../model/types'
import { formatAmount, formatDate } from '../../../shared/lib/format'
import './TransactionList.css'

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
  return (
    <tr>
      <td>{formatDate(transaction.date)}</td>
      <td>{transaction.description}</td>
      <td>{CATEGORY_LABELS[transaction.category]}</td>
      <td>
        <span className={`transaction-type transaction-type--${transaction.type}`}>
          {TYPE_LABELS[transaction.type]}
        </span>
      </td>
      <td className={`transaction-amount transaction-amount--${transaction.type}`}>
        {formatAmount(transaction.amount, transaction.type)}
      </td>
      <td className="transaction-table__actions">
        <button type="button" className="action-button" onClick={() => onEdit(transaction)}>
          Edit
        </button>
        <button
          type="button"
          className="action-button action-button--danger"
          onClick={() => onDelete(transaction.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

// Row-level memo: typing in the search filter re-renders the page on
// every keystroke, and only the rows whose props changed should pay.
const MemoizedRow = memo(TransactionRow)

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  return (
    <table className="transaction-table">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Description</th>
          <th scope="col">Category</th>
          <th scope="col">Type</th>
          <th scope="col" className="transaction-table__amount">
            Amount
          </th>
          <th scope="col">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <MemoizedRow
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  )
}
