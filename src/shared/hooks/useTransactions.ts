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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transactions'] })

  const create = useMutation({ mutationFn: api.createTransaction, onSuccess: invalidate })
  // CSV import commits many rows as one mutation so the cache
  // invalidates once after the whole batch finishes.
  const createMany = useMutation({
    mutationFn: (inputs: readonly TransactionInput[]) =>
      Promise.all(inputs.map(api.createTransaction)),
    onSuccess: invalidate,
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

  return {
    transactions: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    addTransaction: (input) => create.mutate(input),
    addTransactions: (inputs) => {
      if (inputs.length > 0) {
        createMany.mutate(inputs)
      }
    },
    updateTransaction: (id, input) => update.mutate({ id, input }),
    removeTransaction: (id) => remove.mutate(id),
    refetch: () => {
      void query.refetch()
    },
  }
}
