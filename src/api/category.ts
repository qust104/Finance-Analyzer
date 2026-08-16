import type { CategoryDef, CategoryInput } from '../entities/category/model/types'
import { request } from './request'

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function getCategories(): Promise<CategoryDef[]> {
  const data = await request<unknown>('/api/categories')
  if (!Array.isArray(data)) {
    throw new Error('Invalid categories response')
  }
  return data as CategoryDef[]
}

export function createCategory(input: CategoryInput): Promise<CategoryDef> {
  return request('/api/categories', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function updateCategory(key: string, input: CategoryInput): Promise<CategoryDef> {
  return request(`/api/categories/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
}

export function deleteCategory(key: string): Promise<void> {
  return request(`/api/categories/${encodeURIComponent(key)}`, { method: 'DELETE' })
}