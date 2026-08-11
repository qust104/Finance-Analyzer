import { isBudget } from '../entities/budget/model/budgetStorage'
import type { Budget, BudgetInput } from '../entities/budget/model/types'
import { request } from './request'

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function getBudgets(): Promise<Budget[]> {
  const data = await request<unknown>('/api/budgets')
  if (!Array.isArray(data)) {
    throw new Error('Invalid budgets response')
  }
  return data.filter(isBudget)
}

export function createBudget(input: BudgetInput): Promise<Budget> {
  return request('/api/budgets', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function updateBudget(id: string, input: BudgetInput): Promise<Budget> {
  return request(`/api/budgets/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function deleteBudget(id: string): Promise<void> {
  return request(`/api/budgets/${id}`, { method: 'DELETE' })
}
