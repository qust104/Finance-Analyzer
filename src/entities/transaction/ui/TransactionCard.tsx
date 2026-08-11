import { memo } from 'react'
import type { Transaction } from '../model/types'
import { CATEGORY_LABELS, TYPE_LABELS } from '../model/types'
import { formatAmount, formatDate } from '../../../shared/lib/format'
import './TransactionList.css'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export const TransactionCard = memo(function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  return (
    <article className="transaction-card">
      <div className="transaction-card__top">
        <span className={`transaction-type transaction-type--${transaction.type}`}>
          {TYPE_LABELS[transaction.type]}
        </span>
        <span className={`transaction-amount transaction-amount--${transaction.type}`}>
          {formatAmount(transaction.amount, transaction.type)}
        </span>
      </div>
      <p className="transaction-card__description">{transaction.description}</p>
      <div className="transaction-card__meta">
        <span>{CATEGORY_LABELS[transaction.category]}</span>
        <span>{formatDate(transaction.date)}</span>
      </div>
      <div className="transaction-card__actions">
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
      </div>
    </article>
  )
})
