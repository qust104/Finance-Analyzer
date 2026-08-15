import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api/transactions'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import type { Transaction } from '../../entities/transaction/model/types'

export interface TransactionsApi {
  transactions: Transaction[]
  isPending: boolean
  isError: boolean
  addTransaction: (input: TransactionInput) => void
  addTransactions: (inputs: readonly TransactionInput[]) => void
  updateTransaction: (id: string, input: TransactionInput) => void
  removeTransaction: (id: string) => void
  refetch: () => void
}

// Server state lives in TanStack Query: the query cache is the only
// source the UI reads, mutations write through the API and invalidate.
export function useTransactions(): TransactionsApi {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    [queryClient],
  )

  const create = useMutation({ mutationFn: api.createTransaction, onSuccess: invalidate })
  // CSV import commits many rows as one mutation so the cache
  // invalidates once after the whole batch finishes. A partial batch
  // failure would otherwise leave committed rows invisible: rows are
  // settled individually and the cache is refreshed in any outcome.
  const createMany = useMutation({
    mutationFn: async (inputs: readonly TransactionInput[]) => {
      const results = await Promise.allSettled(inputs.map(api.createTransaction))
      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failed.length > 0) {
        throw new Error(`${failed.length} of ${inputs.length} rows failed to import`)
      }
    },
    onSettled: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) =>
      api.updateTransaction(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: invalidate,
  })

  // Mutation objects are stable, and the wrappers below are too:
  // rows memoize on their callbacks, so unstable references would
  // defeat that memoization and re-render the whole table.
  const addTransaction = useCallback(
    (input: TransactionInput) => create.mutate(input),
    [create],
  )
  const addTransactions = useCallback(
    (inputs: readonly TransactionInput[]) => {
      if (inputs.length > 0) {
        createMany.mutate(inputs)
      }
    },
    [createMany],
  )
  const updateTransaction = useCallback(
    (id: string, input: TransactionInput) => update.mutate({ id, input }),
    [update],
  )
  const removeTransaction = useCallback((id: string) => remove.mutate(id), [remove])
  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  return {
    transactions: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addTransaction,
    addTransactions,
    updateTransaction,
    removeTransaction,
    refetch,
  }
}
