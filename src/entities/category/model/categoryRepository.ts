import { BUILTIN_CATEGORIES, normalizeCategoryKey } from './catalog'
import { isCustomCategory, readCustomCategories, writeCustomCategories } from './categoryStorage'
import type { CategoryDef, CategoryInput } from './types'

export interface CategoryRepository {
  getAll(): CategoryDef[]
  create(input: CategoryInput): CategoryDef
  update(key: string, input: CategoryInput): CategoryDef
  delete(key: string): void
  replaceAll(next: readonly CategoryDef[]): void
}

function createCategoryRepository(
  initial: readonly CategoryDef[],
  persist: (next: CategoryDef[]) => void,
): CategoryRepository {
  let custom = [...initial]

  const getAll = (): CategoryDef[] => [...BUILTIN_CATEGORIES, ...custom]

  const normalizeAliases = (aliases: readonly string[]): string[] => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const alias of aliases) {
      const normalized = alias.trim().toLowerCase()
      if (normalized === '' || seen.has(normalized)) continue
      seen.add(normalized)
      result.push(normalized)
    }
    return result
  }

  return {
    getAll,

    create(input) {
      const key = normalizeCategoryKey(input.label)
      if (getAll().some((category) => category.key === key)) {
        throw new Error(`Category "${input.label}" already exists`)
      }
      const category: CategoryDef = {
        key,
        label: input.label.trim(),
        color: input.color,
        aliases: normalizeAliases(input.aliases),
        builtin: false,
      }
      custom = [category, ...custom]
      persist(custom)
      return category
    },

    update(key, input) {
      const index = custom.findIndex((category) => category.key === key)
      if (index === -1) {
        throw new Error('Built-in categories cannot be edited')
      }
      const updated: CategoryDef = {
        ...custom[index],
        label: input.label.trim(),
        color: input.color,
        aliases: normalizeAliases(input.aliases),
      }
      custom = custom.map((category, i) => (i === index ? updated : category))
      persist(custom)
      return updated
    },

    delete(key) {
      if (custom.find((category) => category.key === key) === undefined) {
        throw new Error('Built-in categories cannot be deleted')
      }
      custom = custom.filter((category) => category.key !== key)
      persist(custom)
    },

    replaceAll(next) {
      custom = next.filter((category) => !category.builtin && isCustomCategory(category))
      persist(custom)
    },
  }
}

export function createLocalStorageCategoryRepository(): CategoryRepository {
  return createCategoryRepository(readCustomCategories(), writeCustomCategories)
}