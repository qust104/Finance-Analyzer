import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { budgetSchema } from '../model/budgetSchema'
import type { BudgetFormValues } from '../model/budgetSchema'
import type { Budget, BudgetInput } from '../model/types'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '../../transaction/model/types'
import type { Category } from '../../transaction/model/types'
import './BudgetForm.css'
import '../../../shared/ui/form.css'

interface BudgetFormProps {
  initialValue?: Budget
  // Categories that already have a budget and are not available for new ones.
  usedCategories: Category[]
  submitError?: string | null
  isSubmitting?: boolean
  onSubmit: (input: BudgetInput) => void
  onCancel: () => void
}

export function BudgetForm({
  initialValue,
  usedCategories,
  submitError,
  isSubmitting,
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: initialValue?.category ?? '',
      amount: initialValue ? String(initialValue.amount) : '',
      period: 'monthly',
    },
  })

  const availableCategories = ALL_CATEGORIES.filter(
    (item) => !usedCategories.includes(item) || item === initialValue?.category,
  )

  const submit: SubmitHandler<BudgetFormValues> = (values) => {
    onSubmit({
      category: values.category as Category,
      amount: Number(values.amount),
      period: 'monthly',
    })
  }

  return (
    <form className="budget-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="budget-category">
          Category
        </label>
        <select
          id="budget-category"
          className="form-field__control"
          {...register('category')}
          disabled={initialValue !== undefined}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? 'budget-category-error' : undefined}
        >
          <option value="">Select category</option>
          {availableCategories.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="budget-category-error" className="form-field__error">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="budget-amount">
          Monthly limit
        </label>
        <input
          id="budget-amount"
          className="form-field__control"
          type="number"
          min="1"
          step="0.01"
          {...register('amount')}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? 'budget-amount-error' : undefined}
        />
        {errors.amount && (
          <p id="budget-amount-error" className="form-field__error">
            {errors.amount.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="form__server-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="budget-form__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Add budget'}
        </button>
      </div>
    </form>
  )
}
