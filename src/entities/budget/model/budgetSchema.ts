import { z } from 'zod'

export const budgetSchema = z.object({
  category: z.string().min(1, { error: 'Category is required' }),
  amount: z.coerce
    .number()
    .positive({ error: 'Amount must be a positive number' })
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      error: 'Amount can have at most 2 decimal places',
    }),
  period: z.literal('monthly'),
})

export type BudgetFormValues = z.input<typeof budgetSchema>
