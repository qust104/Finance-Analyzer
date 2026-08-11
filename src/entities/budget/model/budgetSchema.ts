import { z } from 'zod'
import { ALL_CATEGORIES } from '../../transaction/model/types'

export const budgetSchema = z.object({
  category: z.string().refine((value) => (ALL_CATEGORIES as readonly string[]).includes(value), {
    error: 'Category is required',
  }),
  amount: z.coerce.number().positive({ error: 'Amount must be a positive number' }),
  period: z.literal('monthly'),
})

export type BudgetFormValues = z.input<typeof budgetSchema>
