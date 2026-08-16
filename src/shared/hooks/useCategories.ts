import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/category'
import type { CategoryDef, CategoryInput } from '../../entities/category/model/types'
import { anyMutationPending, mutationErrorMessage } from '../lib/mutationState'

export interface CategoriesApi {
  categories: CategoryDef[]
  isPending: boolean
  isError: boolean
  addCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (key: string, input: CategoryInput) => Promise<void>
  removeCategory: (key: string) => Promise<void>
  refetch: () => void
  saveState: { isPending: boolean; error: string | null }
}

export function useCategories(): CategoriesApi {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    [queryClient],
  )

  const create = useMutation({ mutationFn: api.createCategory, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ key, input }: { key: string; input: CategoryInput }) =>
      api.updateCategory(key, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (key: string) => api.deleteCategory(key),
    onSuccess: invalidate,
  })

  const addCategory = useCallback(
    (input: CategoryInput) => create.mutateAsync(input).then(() => undefined),
    [create],
  )
  const updateCategory = useCallback(
    (key: string, input: CategoryInput) =>
      update.mutateAsync({ key, input }).then(() => undefined),
    [update],
  )
  const removeCategory = useCallback(
    (key: string) => remove.mutateAsync(key).then(() => undefined),
    [remove],
  )
  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  return {
    categories: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addCategory,
    updateCategory,
    removeCategory,
    refetch,
    saveState: {
      isPending: anyMutationPending(create, update),
      error: mutationErrorMessage(create, update),
    },
  }
}