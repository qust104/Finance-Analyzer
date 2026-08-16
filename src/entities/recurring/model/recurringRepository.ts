import { readRecurring, writeRecurring } from './recurringStorage'
import type { RecurringDef, RecurringInput } from './types'

export interface RecurringRepository {
  getAll(): RecurringDef[]
  create(input: RecurringInput): RecurringDef
  update(id: string, input: RecurringInput): RecurringDef
  // Engine-only: the generator moves `lastPostedDate` forward after
  // it turned the next period into transactions.
  advance(id: string, lastPostedDate: string): RecurringDef
  delete(id: string): void
  replaceAll(next: readonly RecurringDef[]): void
}

function generateId(): string {
  return crypto.randomUUID()
}

// CRUD behavior is identical for every storage source;
// the source only decides where the initial state comes from.
function createRecurringRepository(
  initial: readonly RecurringDef[],
  persist: (next: RecurringDef[]) => void,
): RecurringRepository {
  let recurring = [...initial]

  return {
    getAll() {
      return [...recurring]
    },

    create(input) {
      const template: RecurringDef = {
        id: generateId(),
        lastPostedDate: null,
        ...input,
      }
      recurring = [template, ...recurring]
      persist(recurring)
      return template
    },

    update(id, input) {
      const index = recurring.findIndex((template) => template.id === id)
      if (index === -1) {
        throw new Error(`Recurring template with id "${id}" not found`)
      }
      const updated: RecurringDef = { ...recurring[index], ...input }
      recurring = recurring.map((template) => (template.id === id ? updated : template))
      persist(recurring)
      return updated
    },

    advance(id, lastPostedDate) {
      const index = recurring.findIndex((template) => template.id === id)
      if (index === -1) {
        throw new Error(`Recurring template with id "${id}" not found`)
      }
      const updated: RecurringDef = { ...recurring[index], lastPostedDate }
      recurring = recurring.map((template) => (template.id === id ? updated : template))
      persist(recurring)
      return updated
    },

    delete(id) {
      recurring = recurring.filter((template) => template.id !== id)
      persist(recurring)
    },

    replaceAll(next) {
      recurring = [...next]
      persist(recurring)
    },
  }
}

export function createLocalStorageRecurringRepository(
  initial: readonly RecurringDef[] = [],
): RecurringRepository {
  return createRecurringRepository(readRecurring() ?? [...initial], writeRecurring)
}