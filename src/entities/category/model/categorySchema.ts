import { z } from 'zod'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export const categorySchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(30, { error: 'Name can be at most 30 characters' }),
  color: z.string().regex(HEX_COLOR, { error: 'Color is required' }),
  aliases: z
    .array(z.string().trim().min(1, { error: 'Aliases cannot be empty' }))
    .max(20, { error: 'Too many aliases' }),
})

export type CategoryFormValues = z.input<typeof categorySchema>