// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BUILTIN_CATEGORIES } from '../../entities/category/model/catalog'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'
import { BudgetOverview } from './BudgetOverview'

const budget: Budget = {
  id: 'b1',
  category: 'food',
  amount: 5000,
  period: 'monthly',
}

const transaction = (date: string): Transaction => ({
  id: date,
  date,
  amount: 100,
  type: 'expense',
  category: 'food',
  description: 'Groceries',
  account: 'Checking Account',
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 7, 16))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('BudgetOverview', () => {
  it('shows a fallback banner when the current month has no data', () => {
    render(
      <MemoryRouter>
        <BudgetOverview
          transactions={[transaction('2026-07-05')]}
          budgets={[budget]}
          categories={BUILTIN_CATEGORIES}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('No transactions yet this month — showing July 2026'),
    ).toBeInTheDocument()
  })

  it('shows no banner when the current month has data', () => {
    render(
      <MemoryRouter>
        <BudgetOverview
          transactions={[transaction('2026-08-05')]}
          budgets={[budget]}
          categories={BUILTIN_CATEGORIES}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/No transactions yet this month/)).not.toBeInTheDocument()
  })
})
