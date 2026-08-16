import { z } from 'zod'
import type { Category } from '../../transaction/model/types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  )
}

const dateField = z.string().refine(isValidIsoDate, { error: 'Date is required' })

// One schema is the single source of truth: the recurring form and the
// API layer both validate through it. `lastPostedDate` is engine state
// and never comes from the form.
export const recurringSchema = z
  .object({
    description: z.string().min(1, { error: 'Description is required' }),
    amount: z.coerce
      .number()
      .positive({ error: 'Amount must be a positive number' })
      .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
        error: 'Amount can have at most 2 decimal places',
      }),
    type: z.enum(['income', 'expense'], { error: 'Type is required' }),
    category: z
      .string()
      .min(1, { error: 'Category is required' })
      .transform((value) => value as Category),
    interval: z.enum(['weekly', 'monthly', 'yearly'], { error: 'Interval is required' }),
    startDate: dateField,
    endDate: z
      .union([dateField, z.literal(''), z.null()])
      .optional()
      .transform((value) => (value === '' ? null : value ?? null)),
    active: z.boolean().default(true),
  })
  .superRefine((values, context) => {
    if (values.endDate !== null && values.endDate < values.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date cannot be before the start date',
      })
    }
  })

export type RecurringFormValues = z.input<typeof recurringSchema>