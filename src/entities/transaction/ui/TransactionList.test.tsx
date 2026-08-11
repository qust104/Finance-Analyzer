// @vitest-environment jsdom
import { Profiler } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../model/types'
import { TransactionList } from './TransactionList'

function makeTransaction(id: number): Transaction {
  return {
    id: `t-${id}`,
    date: `2026-08-${String((id % 28) + 1).padStart(2, '0')}`,
    description: `Transaction ${id}`,
    amount: 100 + id,
    type: 'expense',
    category: 'food',
  }
}

describe('TransactionList', () => {
  it('renders every row', () => {
    const transactions = [makeTransaction(1), makeTransaction(2)]
    render(<TransactionList transactions={transactions} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Transaction 1')).toBeInTheDocument()
    expect(screen.getByText('Transaction 2')).toBeInTheDocument()
  })

  it('does not re-render existing rows when the parent re-renders', () => {
    // 2000 rows make the difference measurable; the memoized rows make
    // the second render a cheap map over props instead of 2000 component
    // renders, so a 50% threshold has a wide safety margin.
    const transactions = Array.from({ length: 2000 }, (_, i) => makeTransaction(i))
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const durations: number[] = []

    // The wrapper re-renders while the list gets identical props:
    // without row memoization both renders cost about the same.
    function Harness({ tick }: { tick: number }) {
      return (
        <div data-tick={tick}>
          <Profiler
            id="transaction-list"
            onRender={(_id, _phase, actualDuration) => durations.push(actualDuration)}
          >
            <TransactionList transactions={transactions} onEdit={onEdit} onDelete={onDelete} />
          </Profiler>
        </div>
      )
    }

    const { rerender } = render(<Harness tick={0} />)
    rerender(<Harness tick={1} />)

    expect(durations).toHaveLength(2)
    expect(durations[1] ?? 0).toBeLessThanOrEqual((durations[0] ?? 0) / 2)
  })

  it('calls onEdit and onDelete with the right payloads', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <TransactionList transactions={[makeTransaction(1)]} onEdit={onEdit} onDelete={onDelete} />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledWith(makeTransaction(1))

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('t-1')
  })

  it('keeps existing rows untouched when a new transaction is prepended', () => {
    const transactions = Array.from({ length: 100 }, (_, i) => makeTransaction(i))
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    const { rerender } = render(
      <TransactionList transactions={transactions} onEdit={onEdit} onDelete={onDelete} />,
    )
    const firstRow = screen.getByText('Transaction 0').closest('tr')

    rerender(
      <TransactionList
        transactions={[makeTransaction(100), ...transactions]}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    expect(screen.getAllByRole('row')).toHaveLength(102)
    expect(screen.getByText('Transaction 0').closest('tr')).toBe(firstRow)
  })
})