import type { CategoryDef } from './types'

// The built-in catalogue is compiled in: existing rows reference these
// keys, so they can never be edited or removed by users.
export const BUILTIN_CATEGORIES: CategoryDef[] = [
  {
    key: 'salary',
    label: 'Salary',
    color: '#22c55e',
    aliases: ['зарплата', 'зп', 'salary'],
    builtin: true,
  },
  {
    key: 'food',
    label: 'Food',
    color: '#f59e0b',
    aliases: ['еда', 'продукты', 'groceries', 'grocery', 'food'],
    builtin: true,
  },
  {
    key: 'transport',
    label: 'Transport',
    color: '#3b82f6',
    aliases: ['транспорт', 'transport'],
    builtin: true,
  },
  {
    key: 'shopping',
    label: 'Shopping',
    color: '#8b5cf6',
    aliases: ['покупки', 'шоппинг', 'shopping'],
    builtin: true,
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    color: '#ec4899',
    aliases: ['развлечения', 'досуг', 'entertainment'],
    builtin: true,
  },
  {
    key: 'health',
    label: 'Health',
    color: '#10b981',
    aliases: ['здоровье', 'медицина', 'health'],
    builtin: true,
  },
  {
    key: 'housing',
    label: 'Housing',
    color: '#f97316',
    aliases: ['жильё', 'аренда', 'housing'],
    builtin: true,
  },
  {
    key: 'other',
    label: 'Other',
    color: '#94a3b8',
    aliases: ['прочее', 'другое', 'other'],
    builtin: true,
  },
]

export const CATEGORY_PALETTE = [
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f97316',
  '#22c55e',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#d946ef',
  '#64748b',
]

const FALLBACK_COLOR = '#94a3b8'

export function normalizeCategoryKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findCategory(
  categories: readonly CategoryDef[],
  key: string,
): CategoryDef | undefined {
  return categories.find((category) => category.key === key)
}

// Unknown keys keep working visually: a row whose category was somehow
// removed still renders its raw key instead of crashing the label.
export function categoryLabelOf(categories: readonly CategoryDef[], key: string): string {
  return findCategory(categories, key)?.label ?? key
}

export function categoryColorOf(categories: readonly CategoryDef[], key: string): string {
  return findCategory(categories, key)?.color ?? FALLBACK_COLOR
}

// CSV cells never match our canonical keys exactly.
// The order matters: key, then display label, then user aliases.
export function resolveCategoryKey(
  categories: readonly CategoryDef[],
  raw: string,
): string | null {
  const key = raw.trim().toLowerCase()
  if (key === '') return null
  const exact = categories.find((category) => category.key === key)
  if (exact) return exact.key
  const byLabel = categories.find((category) => category.label.toLowerCase() === key)
  if (byLabel) return byLabel.key
  const byAlias = categories.find((category) => category.aliases.includes(key))
  return byAlias?.key ?? null
}