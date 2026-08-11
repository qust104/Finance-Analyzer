import type { Transaction } from '../model/types'
import { CATEGORY_LABELS, TYPE_LABELS } from '../model/types'
import { formatAmount, formatDate } from '../../../shared/lib/format'
import './TransactionList.css'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

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
          <tr key={transaction.id}>
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
        ))}
      </tbody>
    </table>
  )
}
