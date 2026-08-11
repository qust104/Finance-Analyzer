import { useState } from 'react'
import { createLocalStorageBudgetRepository } from '../../entities/budget/model/budgetRepository'
import type { BudgetInput } from '../../entities/budget/model/types'
import type { Budget } from '../../entities/budget/model/types'

const budgetRepository = createLocalStorageBudgetRepository()

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(() => budgetRepository.getAll())

  const addBudget = (input: BudgetInput) => {
    const created = budgetRepository.create(input)
    setBudgets((prev) => [created, ...prev])
  }

  const updateBudget = (id: string, input: BudgetInput) => {
    const updated = budgetRepository.update(id, input)
    setBudgets((prev) => prev.map((budget) => (budget.id === id ? updated : budget)))
  }

  const removeBudget = (id: string) => {
    budgetRepository.delete(id)
    setBudgets((prev) => prev.filter((budget) => budget.id !== id))
  }

  return { budgets, addBudget, updateBudget, removeBudget }
}
