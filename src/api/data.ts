import type { Budget } from '../entities/budget/model/types'
import type { CategoryDef } from '../entities/category/model/types'
import type { Transaction } from '../entities/transaction/model/types'
import { request } from './request'

const jsonHeaders = { 'Content-Type': 'application/json' }

// Full-snapshot restore replaces every transaction and budget in one
// request; the server refuses malformed rows before touching storage.
// Categories are opt-in: backups written before the catalogue existed
// leave it untouched.
export async function restoreData(
  transactions: readonly Transaction[],
  budgets: readonly Budget[],
  categories?: readonly CategoryDef[],
): Promise<void> {
  await request<unknown>('/api/data', {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({
      transactions,
      budgets,
      ...(categories ? { categories } : {}),
    }),
  })
}