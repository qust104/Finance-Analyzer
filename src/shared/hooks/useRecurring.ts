import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/recurring'
import type { RecurringDef, RecurringInput } from '../../entities/recurring/model/types'
import { anyMutationPending, mutationErrorMessage } from '../lib/mutationState'

export interface RecurringApi {
  recurring: RecurringDef[]
  isPending: boolean
  isError: boolean
  addRecurring: (input: RecurringInput) => Promise<void>
  updateRecurring: (id: string, input: RecurringInput) => Promise<void>
  removeRecurring: (id: string) => void
  restoreRecurring: (template: RecurringDef) => Promise<void>
  refetch: () => void
  saveState: { isPending: boolean; error: string | null }
}

export function useRecurring(): RecurringApi {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['recurring'],
    queryFn: api.getRecurring,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
    [queryClient],
  )

  const create = useMutation({ mutationFn: api.createRecurring, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringInput }) =>
      api.updateRecurring(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteRecurring(id),
    onSuccess: invalidate,
  })
  const restore = useMutation({
    mutationFn: api.restoreRecurring,
    onSuccess: invalidate,
  })

  const addRecurring = useCallback(
    (input: RecurringInput) => create.mutateAsync(input).then(() => undefined),
    [create],
  )
  const updateRecurring = useCallback(
    (id: string, input: RecurringInput) =>
      update.mutateAsync({ id, input }).then(() => undefined),
    [update],
  )
  const removeRecurring = useCallback((id: string) => remove.mutate(id), [remove])
  const restoreRecurring = useCallback(
    (template: RecurringDef) => restore.mutateAsync(template).then(() => undefined),
    [restore],
  )
  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  return {
    recurring: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addRecurring,
    updateRecurring,
    removeRecurring,
    restoreRecurring,
    refetch,
    saveState: {
      isPending: anyMutationPending(create, update),
      error: mutationErrorMessage(create, update),
    },
  }
}