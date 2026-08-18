import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'

const transaction: Transaction = {
  id: 't1',
  date: '2026-08-01',
  amount: 100,
  type: 'expense',
  category: 'food',
  description: 'Lunch',
  account: 'Checking Account',
}

const budget: Budget = {
  id: 'b1',
  category: 'food',
  amount: 5000,
  period: 'monthly',
}

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      importOpen: false,
      transactionForm: null,
      budgetForm: null,
    })
  })

  it('opens and closes the import modal', () => {
    expect(useUiStore.getState().importOpen).toBe(false)

    useUiStore.getState().openImportModal()
    expect(useUiStore.getState().importOpen).toBe(true)

    useUiStore.getState().closeImportModal()
    expect(useUiStore.getState().importOpen).toBe(false)
  })

  it('tracks the transaction being edited', () => {
    useUiStore.getState().openTransactionForm('new')
    expect(useUiStore.getState().transactionForm).toBe('new')

    useUiStore.getState().openTransactionForm(transaction)
    expect(useUiStore.getState().transactionForm).toBe(transaction)

    useUiStore.getState().closeTransactionForm()
    expect(useUiStore.getState().transactionForm).toBeNull()
  })

  it('tracks the budget being edited', () => {
    useUiStore.getState().openBudgetForm('new')
    expect(useUiStore.getState().budgetForm).toBe('new')

    useUiStore.getState().openBudgetForm(budget)
    expect(useUiStore.getState().budgetForm).toBe(budget)

    useUiStore.getState().closeBudgetForm()
    expect(useUiStore.getState().budgetForm).toBeNull()
  })
})