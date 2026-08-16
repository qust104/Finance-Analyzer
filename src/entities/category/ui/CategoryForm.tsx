import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { CATEGORY_PALETTE } from '../model/catalog'
import { categorySchema } from '../model/categorySchema'
import type { CategoryFormValues } from '../model/categorySchema'
import type { CategoryDef, CategoryInput } from '../model/types'
import './CategoryForm.css'
import '../../../shared/ui/form.css'

interface CategoryFormProps {
  initialValue?: CategoryDef
  submitError?: string | null
  isSubmitting?: boolean
  onSubmit: (input: CategoryInput) => void
  onCancel: () => void
}

export function CategoryForm({
  initialValue,
  submitError,
  isSubmitting,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const initialAliases = initialValue?.aliases ?? []
  const initialColor = initialValue?.color ?? CATEGORY_PALETTE[0]
  const [aliasesText, setAliasesText] = useState(initialAliases.join(', '))

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      label: initialValue?.label ?? '',
      color: initialColor,
      aliases: initialAliases,
    },
  })

  const selectedColor = useWatch({ control, name: 'color' }) ?? initialColor

  const submit: SubmitHandler<CategoryFormValues> = (values) => {
    const aliases = aliasesText
      .split(',')
      .map((alias) => alias.trim())
      .filter((alias) => alias !== '')
    onSubmit({
      label: values.label,
      color: values.color,
      aliases,
    })
  }

  return (
    <form className="category-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="category-name">
          Name
        </label>
        <input
          id="category-name"
          className="form-field__control"
          type="text"
          {...register('label')}
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? 'category-name-error' : undefined}
        />
        {errors.label && (
          <p id="category-name-error" className="form-field__error">
            {errors.label.message}
          </p>
        )}
      </div>

      <fieldset className="category-form__colors">
        <legend className="form-field__label">Color</legend>
        <div className="category-form__palette">
          {CATEGORY_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={`category-form__swatch${
                selectedColor === color ? ' category-form__swatch--selected' : ''
              }`}
              style={{ background: color }}
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor === color}
              onClick={() => setValue('color', color, { shouldValidate: true })}
            />
          ))}
        </div>
      </fieldset>

      <div className="form-field">
        <label className="form-field__label" htmlFor="category-aliases">
          CSV aliases
        </label>
        <input
          id="category-aliases"
          className="form-field__control"
          type="text"
          placeholder="e.g. cats, vet, pets"
          value={aliasesText}
          onChange={(event) => setAliasesText(event.target.value)}
        />
        <p className="form-field__hint">
          Comma-separated. Imported CSV rows match these words against this category.
        </p>
      </div>

      {submitError && (
        <p className="form__server-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="category-form__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Add category'}
        </button>
      </div>
    </form>
  )
}