import { Link } from 'react-router-dom'
import { CATEGORY_LABELS } from '../../entities/transaction/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { formatAmount, formatDate } from '../../shared/lib/format'
import './RecentTransactions.css'

interface RecentTransactionsProps {
  transactions: readonly Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div className="dashboard-card">
      <div className="recent-transactions__header">
        <h2 className="dashboard-card__title">Recent Transactions</h2>
        <Link to="/transactions" className="recent-transactions__link">
          View all
        </Link>
      </div>
      <ul className="recent-transactions">
        {recent.map((transaction) => (
          <li key={transaction.id} className="recent-transactions__item">
            <span className="recent-transactions__description">{transaction.description}</span>
            <span className="recent-transactions__category">
              {CATEGORY_LABELS[transaction.category]}
            </span>
            <span className="recent-transactions__date">{formatDate(transaction.date)}</span>
            <span
              className={`recent-transactions__amount recent-transactions__amount--${transaction.type}`}
            >
              {formatAmount(transaction.amount, transaction.type)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
