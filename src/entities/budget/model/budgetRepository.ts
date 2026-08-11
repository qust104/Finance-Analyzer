import { readBudgets, writeBudgets } from './budgetStorage'
import type { Budget, BudgetInput } from './types'

export interface BudgetRepository {
  getAll(): Budget[]
  create(input: BudgetInput): Budget
  update(id: string, input: BudgetInput): Budget
  delete(id: string): void
}

function generateId(): string {
  return crypto.randomUUID()
}

// CRUD behavior is identical for every storage source;
// the source only decides where the initial state comes from.
function createBudgetRepository(
  initial: readonly Budget[],
  persist: (next: Budget[]) => void,
): BudgetRepository {
  let budgets = [...initial]

  return {
    getAll() {
      return [...budgets]
    },

    create(input) {
      const budget: Budget = { id: generateId(), ...input }
      budgets = [budget, ...budgets]
      persist(budgets)
      return budget
    },

    update(id, input) {
      const index = budgets.findIndex((budget) => budget.id === id)
      if (index === -1) {
        throw new Error(`Budget with id "${id}" not found`)
      }
      const updated: Budget = { ...budgets[index], ...input }
      budgets = budgets.map((budget) => (budget.id === id ? updated : budget))
      persist(budgets)
      return updated
    },

    delete(id) {
      budgets = budgets.filter((budget) => budget.id !== id)
      persist(budgets)
    },
  }
}

export function createLocalStorageBudgetRepository(
  initial: readonly Budget[] = [],
): BudgetRepository {
  return createBudgetRepository(readBudgets() ?? [...initial], writeBudgets)
}
