import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/budgets'
import type { Budget, BudgetInput } from '../../entities/budget/model/types'

export interface BudgetsApi {
  budgets: Budget[]
  isPending: boolean
  isError: boolean
  addBudget: (input: BudgetInput) => void
  updateBudget: (id: string, input: BudgetInput) => void
  removeBudget: (id: string) => void
  refetch: () => void
}

export function useBudgets(): BudgetsApi {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['budgets'],
    queryFn: api.getBudgets,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['budgets'] })

  const create = useMutation({ mutationFn: api.createBudget, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BudgetInput }) => api.updateBudget(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteBudget(id),
    onSuccess: invalidate,
  })

  return {
    budgets: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addBudget: (input) => create.mutate(input),
    updateBudget: (id, input) => update.mutate({ id, input }),
    removeBudget: (id) => remove.mutate(id),
    refetch: () => {
      void query.refetch()
    },
  }
}
