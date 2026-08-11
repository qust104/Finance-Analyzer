import { z } from 'zod'
import { ALL_CATEGORIES } from './types'
import type { Category } from './types'

// One schema is the single source of truth for validation rules:
// the transaction form validates through it, and the future API layer
// will reuse it as the row contract.
// CSV import keeps its own normalizer: it receives raw strings with
// locale-specific numbers and aliases before reaching domain shape.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const transactionSchema = z.object({
  date: z.string().regex(ISO_DATE, { error: 'Date is required' }),
  description: z.string().min(1, { error: 'Description is required' }),
  amount: z.coerce.number().positive({ error: 'Amount must be a positive number' }),
  type: z.enum(['income', 'expense'], { error: 'Type is required' }),
  category: z
    .string()
    .refine((value) => (ALL_CATEGORIES as readonly string[]).includes(value), {
      error: 'Category is required',
    })
    // The form sends a raw string; the validated output is the domain
    // type, so the API layer receives a ready TransactionInput.
    .transform((value) => value as Category),
})

// Form values are strings because HTML inputs always produce strings;
// the schema coerces the amount on validation and the submit handler
// converts it into a TransactionInput.
export type TransactionFormValues = z.input<typeof transactionSchema>
