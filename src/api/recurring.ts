import type { RecurringDef, RecurringInput } from '../entities/recurring/model/types'
import { request } from './request'

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function getRecurring(): Promise<RecurringDef[]> {
  const data = await request<unknown>('/api/recurring')
  if (!Array.isArray(data)) {
    throw new Error('Invalid recurring response')
  }
  return data as RecurringDef[]
}

export function createRecurring(input: RecurringInput): Promise<RecurringDef> {
  return request('/api/recurring', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function updateRecurring(id: string, input: RecurringInput): Promise<RecurringDef> {
  return request(`/api/recurring/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function deleteRecurring(id: string): Promise<void> {
  return request(`/api/recurring/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Runs the recurring engine: creates the due transactions and advances
// the templates. Idempotent — repeating the call creates nothing new.
export function applyRecurring(): Promise<{ created: number }> {
  return request('/api/recurring/apply', { method: 'POST' })
}