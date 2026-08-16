import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { recurringSchema } from '../model/recurringSchema'
import type { RecurringFormValues } from '../model/recurringSchema'
import type { RecurringDef, RecurringInput } from '../model/types'
import type { CategoryDef } from '../../category/model/types'
import { RECURRING_INTERVALS } from '../model/types'
import './RecurringForm.css'
import '../../../shared/ui/form.css'

type RecurringFormOutput = z.output<typeof recurringSchema>

interface RecurringFormProps {
  initialValue?: RecurringDef
  categories: readonly CategoryDef[]
  submitError?: string | null
  isSubmitting?: boolean
  onSubmit: (input: RecurringInput) => void
  onCancel: () => void
}

function intervalLabel(interval: string): string {
  return interval.charAt(0).toUpperCase() + interval.slice(1)
}

export function RecurringForm({
  initialValue,
  categories,
  submitError,
  isSubmitting,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecurringFormValues, unknown, RecurringFormOutput>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: initialValue?.type ?? 'expense',
      amount: initialValue ? String(initialValue.amount) : '',
      description: initialValue?.description ?? '',
      category: initialValue?.category ?? '',
      interval: initialValue?.interval ?? 'monthly',
      startDate: initialValue?.startDate ?? '',
      endDate: initialValue?.endDate ?? '',
      active: initialValue?.active ?? true,
    },
  })

  const submit: SubmitHandler<RecurringFormOutput> = (values) => {
    onSubmit({
      type: values.type,
      amount: Number(values.amount),
      description: values.description.trim(),
      category: values.category,
      interval: values.interval,
      startDate: values.startDate,
      endDate: values.endDate ?? null,
      active: values.active,
    })
  }

  return (
    <form className="recurring-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-type">
          Type
        </label>
        <select id="recurring-type" className="form-field__control" {...register('type')}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-description">
          Description
        </label>
        <input
          id="recurring-description"
          className="form-field__control"
          type="text"
          placeholder="e.g. Rent, Salary, Netflix"
          {...register('description')}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'recurring-description-error' : undefined}
        />
        {errors.description && (
          <p id="recurring-description-error" className="form-field__error">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-amount">
          Amount
        </label>
        <input
          id="recurring-amount"
          className="form-field__control"
          type="number"
          min="0.01"
          step="0.01"
          {...register('amount')}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? 'recurring-amount-error' : undefined}
        />
        {errors.amount && (
          <p id="recurring-amount-error" className="form-field__error">
            {errors.amount.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-category">
          Category
        </label>
        <select
          id="recurring-category"
          className="form-field__control"
          {...register('category')}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? 'recurring-category-error' : undefined}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="recurring-category-error" className="form-field__error">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-interval">
          Interval
        </label>
        <select
          id="recurring-interval"
          className="form-field__control"
          {...register('interval')}
          aria-invalid={errors.interval ? true : undefined}
          aria-describedby={errors.interval ? 'recurring-interval-error' : undefined}
        >
          {RECURRING_INTERVALS.map((interval) => (
            <option key={interval} value={interval}>
              {intervalLabel(interval)}
            </option>
          ))}
        </select>
        {errors.interval && (
          <p id="recurring-interval-error" className="form-field__error">
            {errors.interval.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-start">
          Start date
        </label>
        <input
          id="recurring-start"
          className="form-field__control"
          type="date"
          {...register('startDate')}
          aria-invalid={errors.startDate ? true : undefined}
          aria-describedby={errors.startDate ? 'recurring-start-error' : undefined}
        />
        {errors.startDate && (
          <p id="recurring-start-error" className="form-field__error">
            {errors.startDate.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="recurring-end">
          End date <span className="form-field__hint">(optional)</span>
        </label>
        <input
          id="recurring-end"
          className="form-field__control"
          type="date"
          {...register('endDate')}
          aria-invalid={errors.endDate ? true : undefined}
          aria-describedby={errors.endDate ? 'recurring-end-error' : undefined}
        />
        {errors.endDate && (
          <p id="recurring-end-error" className="form-field__error">
            {errors.endDate.message}
          </p>
        )}
      </div>

      <div className="form-field form-field--checkbox">
        <label className="form-field__label" htmlFor="recurring-active">
          <input id="recurring-active" type="checkbox" {...register('active')} />
          Post transactions automatically
        </label>
      </div>

      {submitError && (
        <p className="form__server-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="recurring-form__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Add template'}
        </button>
      </div>
    </form>
  )
}