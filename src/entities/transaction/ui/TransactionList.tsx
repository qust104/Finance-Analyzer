import { memo, useEffect, useRef, useState } from 'react'
import type { CategoryDef } from '../../category/model/types'
import { categoryLabelOf } from '../../category/model/catalog'
import type { Transaction } from '../model/types'
import { TYPE_LABELS } from '../model/types'
import { formatAmount, formatDate } from '../../../shared/lib/format'
import { computeVirtualRange } from '../../../shared/lib/virtualWindow'
import './TransactionList.css'

const ROW_HEIGHT = 48
const VIRTUALIZE_THRESHOLD = 1500
const OVERSCAN = 8
const COLUMN_COUNT = 7

interface TransactionRowProps {
  transaction: Transaction
  categories: readonly CategoryDef[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  highlighted: boolean
}

function TransactionRow({
  transaction,
  categories,
  onEdit,
  onDelete,
  highlighted,
}: TransactionRowProps) {
  return (
    <tr
      data-transaction-id={transaction.id}
      className={highlighted ? 'transaction-table__row--highlighted' : undefined}
    >
      <td>{formatDate(transaction.date)}</td>
      <td>{transaction.description}</td>
      <td>{categoryLabelOf(categories, transaction.category)}</td>
      <td className="transaction-account">{transaction.account}</td>
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
  categories: readonly CategoryDef[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  highlightId?: string | null
}

// Row-level memo: typing in the search filter re-renders the page on
// every keystroke, and only the rows whose props changed should pay.
const MemoizedRow = memo(TransactionRow)

export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  highlightId = null,
}: TransactionListProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const measuredRef = useRef(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  // Viewport is measured from the DOM: a zero clientHeight (jsdom) means
  // "cannot virtualize" and the full list renders instead.
  const setWindowRef = (node: HTMLDivElement | null) => {
    if (node) {
      windowRef.current = node
      if (!measuredRef.current) {
        measuredRef.current = true
        if (node.clientHeight > 0) {
          setViewportHeight(node.clientHeight)
        }
      }
    } else {
      windowRef.current = null
      measuredRef.current = false
    }
  }

  useEffect(() => {
    const el = windowRef.current
    if (!el) {
      return
    }
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = windowRef.current
    if (!el || viewportHeight === 0) {
      return
    }
    const onResize = () => setViewportHeight(el.clientHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [viewportHeight])

  const total = transactions.length
  const virtualized = viewportHeight > 0 && total >= VIRTUALIZE_THRESHOLD
  const { start, end } = virtualized
    ? computeVirtualRange(scrollTop, viewportHeight, ROW_HEIGHT, total, OVERSCAN)
    : { start: 0, end: total }

  // A row picked from the command palette may live outside the window:
  // scroll the viewport to its slot so the window covers it.
  useEffect(() => {
    if (!virtualized || highlightId === null) {
      return
    }
    const index = transactions.findIndex((transaction) => transaction.id === highlightId)
    const el = windowRef.current
    if (index < 0 || !el) {
      return
    }
    const target = Math.max(0, index * ROW_HEIGHT - (el.clientHeight - ROW_HEIGHT) / 2)
    if (el.scrollTop !== target) {
      el.scrollTop = target
    }
  }, [virtualized, highlightId, transactions])

  return (
    <div className="transaction-table__window" ref={setWindowRef}>
      <table className="transaction-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Account</th>
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
          {virtualized && start > 0 && (
            <tr className="transaction-table__spacer" aria-hidden="true">
              <td colSpan={COLUMN_COUNT} style={{ height: start * ROW_HEIGHT }} />
            </tr>
          )}
          {transactions.slice(start, end).map((transaction) => (
            <MemoizedRow
              key={transaction.id}
              transaction={transaction}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              highlighted={transaction.id === highlightId}
            />
          ))}
          {virtualized && end < total && (
            <tr className="transaction-table__spacer" aria-hidden="true">
              <td colSpan={COLUMN_COUNT} style={{ height: (total - end) * ROW_HEIGHT }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}