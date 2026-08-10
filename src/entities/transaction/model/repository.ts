import { seedTransactions } from '../../../data/seed'
import type { Category, Transaction, TransactionType } from './types'

export interface TransactionInput {
  date: string
  amount: number
  type: TransactionType
  category: Category
  description: string
}

export interface TransactionRepository {
  getAll(): Transaction[]
  create(input: TransactionInput): Transaction
  update(id: string, input: TransactionInput): Transaction
  delete(id: string): void
}

export function generateId(): string {
  return crypto.randomUUID()
}

// UI must never know where data physically lives.
// Today it is memory, tomorrow localStorage, later an API.
export function createMemoryTransactionRepository(initial: readonly Transaction[] = seedTransactions): TransactionRepository {
  let transactions = [...initial]

  return {
    getAll() {
      return [...transactions]
    },

    create(input) {
      const transaction: Transaction = { id: generateId(), ...input }
      transactions = [transaction, ...transactions]
      return transaction
    },

    update(id, input) {
      const index = transactions.findIndex((transaction) => transaction.id === id)
      if (index === -1) {
        throw new Error(`Transaction with id "${id}" not found`)
      }
      const updated: Transaction = { ...transactions[index], ...input }
      transactions = transactions.map((transaction) => (transaction.id === id ? updated : transaction))
      return updated
    },

    delete(id) {
      transactions = transactions.filter((transaction) => transaction.id !== id)
    },
  }
}