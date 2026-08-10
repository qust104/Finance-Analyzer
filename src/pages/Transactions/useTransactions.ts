import { useState } from 'react'
import { createMemoryTransactionRepository } from '../../entities/transaction/model/repository'
import type { TransactionInput } from '../../entities/transaction/model/repository'
import type { Transaction } from '../../entities/transaction/model/types'

const repository = createMemoryTransactionRepository()

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => repository.getAll())

  const addTransaction = (input: TransactionInput) => {
    const created = repository.create(input)
    setTransactions((prev) => [created, ...prev])
  }

  const updateTransaction = (id: string, input: TransactionInput) => {
    const updated = repository.update(id, input)
    setTransactions((prev) =>
      prev.map((transaction) => (transaction.id === id ? updated : transaction)),
    )
  }

  const removeTransaction = (id: string) => {
    repository.delete(id)
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id))
  }

  return { transactions, addTransaction, updateTransaction, removeTransaction }
}
