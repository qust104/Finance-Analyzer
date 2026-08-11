import { isTransaction } from '../entities/transaction/model/transactionStorage'
import type { Transaction } from '../entities/transaction/model/types'
import type { TransactionInput } from '../entities/transaction/model/repository'
import { request } from './request'

const jsonHeaders = { 'Content-Type': 'application/json' }

// Server responses are filtered through the same guard the storage
// layer uses: domain invariants must never be imported from the wire.
export async function getTransactions(): Promise<Transaction[]> {
  const data = await request<unknown>('/api/transactions')
  if (!Array.isArray(data)) {
    throw new Error('Invalid transactions response')
  }
  return data.filter(isTransaction)
}

export function createTransaction(input: TransactionInput): Promise<Transaction> {
  return request('/api/transactions', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  return request(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function deleteTransaction(id: string): Promise<void> {
  return request(`/api/transactions/${id}`, { method: 'DELETE' })
}
