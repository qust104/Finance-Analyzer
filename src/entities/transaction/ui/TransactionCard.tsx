import { memo } from 'react'
import type { CategoryDef } from '../../category/model/types'
import { categoryLabelOf } from '../../category/model/catalog'
import type { Transaction } from '../model/types'
import { TYPE_LABELS } from '../model/types'
import { formatAmount, formatDate } from '../../../shared/lib/format'
import './TransactionList.css'

interface TransactionCardProps {
  transaction: Transaction
  categories: readonly CategoryDef[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export const TransactionCard = memo(function TransactionCard({
  transaction,
  categories,
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
        <span>{categoryLabelOf(categories, transaction.category)}</span>
        <span>{transaction.account}</span>
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
