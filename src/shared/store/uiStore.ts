import { create } from 'zustand'
import type { Budget } from '../../entities/budget/model/types'
import type { Transaction } from '../../entities/transaction/model/types'

export type FormTarget<T> = T | 'new'

// Client/UI state lives here: modals and the entity being edited.
// It is distinct from server state (transactions/budgets), which
// stays in the TanStack Query cache, and from ephemeral state
// (form fields, typing), which stays in local component hooks.
interface UiState {
  importOpen: boolean
  openImportModal: () => void
  closeImportModal: () => void

  transactionForm: FormTarget<Transaction> | null
  openTransactionForm: (target: FormTarget<Transaction>) => void
  closeTransactionForm: () => void

  budgetForm: FormTarget<Budget> | null
  openBudgetForm: (target: FormTarget<Budget>) => void
  closeBudgetForm: () => void
}

export const useUiStore = create<UiState>((set) => ({
  importOpen: false,
  openImportModal: () => set({ importOpen: true }),
  closeImportModal: () => set({ importOpen: false }),

  transactionForm: null,
  openTransactionForm: (target) => set({ transactionForm: target }),
  closeTransactionForm: () => set({ transactionForm: null }),

  budgetForm: null,
  openBudgetForm: (target) => set({ budgetForm: target }),
  closeBudgetForm: () => set({ budgetForm: null }),
}))