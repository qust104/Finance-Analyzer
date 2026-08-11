import { useCallback } from 'react'
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

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
    [queryClient],
  )

  const create = useMutation({ mutationFn: api.createBudget, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BudgetInput }) => api.updateBudget(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteBudget(id),
    onSuccess: invalidate,
  })

  const addBudget = useCallback((input: BudgetInput) => create.mutate(input), [create])
  const updateBudget = useCallback(
    (id: string, input: BudgetInput) => update.mutate({ id, input }),
    [update],
  )
  const removeBudget = useCallback((id: string) => remove.mutate(id), [remove])
  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  return {
    budgets: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addBudget,
    updateBudget,
    removeBudget,
    refetch,
  }
}
