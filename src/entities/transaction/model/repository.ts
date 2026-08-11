import { seedTransactions } from '../../../data/seed'
import { readTransactions, writeTransactions } from './transactionStorage'
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
// The storage source differs, but CRUD behavior is identical,
// so both factories share one implementation.
function createTransactionRepository(
  initial: readonly Transaction[],
  persist: (next: Transaction[]) => void,
): TransactionRepository {
  let transactions = [...initial]

  return {
    getAll() {
      return [...transactions]
    },

    create(input) {
      const transaction: Transaction = { id: generateId(), ...input }
      transactions = [transaction, ...transactions]
      persist(transactions)
      return transaction
    },

    update(id, input) {
      const index = transactions.findIndex((transaction) => transaction.id === id)
      if (index === -1) {
        throw new Error(`Transaction with id "${id}" not found`)
      }
      const updated: Transaction = { ...transactions[index], ...input }
      transactions = transactions.map((transaction) =>
        transaction.id === id ? updated : transaction,
      )
      persist(transactions)
      return updated
    },

    delete(id) {
      transactions = transactions.filter((transaction) => transaction.id !== id)
      persist(transactions)
    },
  }
}

// In-memory storage stays useful for tests and previews.
export function createMemoryTransactionRepository(
  initial: readonly Transaction[] = seedTransactions,
): TransactionRepository {
  return createTransactionRepository(initial, () => {})
}

export function createLocalStorageTransactionRepository(
  initial: readonly Transaction[] = seedTransactions,
): TransactionRepository {
  return createTransactionRepository(readTransactions() ?? [...initial], writeTransactions)
}
