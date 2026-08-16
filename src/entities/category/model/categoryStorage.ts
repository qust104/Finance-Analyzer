import type { CategoryDef } from './types'

const STORAGE_KEY = 'finance-analyzer.customCategories'
const STORAGE_VERSION = 1
const STORAGE_KEY_VERSIONED = `${STORAGE_KEY}.v${STORAGE_VERSION}`

const HEX_COLOR = /^#[0-9a-f]{6}$/i

// Only custom categories are persisted: the built-in catalogue ships
// with the app, so new releases can grow it without migrations.
export function isCategoryDef(value: unknown): value is CategoryDef {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.key === 'string' &&
    candidate.key.length > 0 &&
    typeof candidate.label === 'string' &&
    candidate.label.length > 0 &&
    typeof candidate.color === 'string' &&
    HEX_COLOR.test(candidate.color) &&
    Array.isArray(candidate.aliases) &&
    candidate.aliases.every((alias) => typeof alias === 'string') &&
    typeof candidate.builtin === 'boolean'
  )
}

// Only custom categories are persisted: the built-in catalogue ships
// with the app, so new releases can grow it without migrations.
export function isCustomCategory(value: unknown): value is CategoryDef {
  return isCategoryDef(value) && value.builtin === false
}

export function readCustomCategories(): CategoryDef[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY_VERSIONED)
  } catch {
    return []
  }
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const valid = parsed.filter(isCustomCategory)
  if (valid.length !== parsed.length) {
    writeCustomCategories(valid)
  }
  return valid
}

export function writeCustomCategories(categories: CategoryDef[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VERSIONED, JSON.stringify(categories))
  } catch {
    // Storage may be unavailable; the app keeps working in memory.
  }
}