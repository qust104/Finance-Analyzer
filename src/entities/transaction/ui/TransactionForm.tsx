import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import type { TransactionInput } from '../model/repository'
import { transactionSchema } from '../model/transactionSchema'
import type { TransactionFormValues } from '../model/transactionSchema'
import type { CategoryDef } from '../../category/model/types'
import type { Category, Transaction } from '../model/types'
import './TransactionForm.css'
import '../../../shared/ui/form.css'

interface TransactionFormProps {
  initialValue?: Transaction
  categories: readonly CategoryDef[]
  submitError?: string | null
  isSubmitting?: boolean
  onSubmit: (input: TransactionInput) => void
  onCancel: () => void
}

export function TransactionForm({
  initialValue,
  categories,
  submitError,
  isSubmitting,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialValue?.type ?? 'expense',
      amount: initialValue ? String(initialValue.amount) : '',
      description: initialValue?.description ?? '',
      category: initialValue?.category ?? '',
      date: initialValue?.date ?? '',
    },
  })

  const submit: SubmitHandler<TransactionFormValues> = (values) => {
    onSubmit({
      type: values.type,
      amount: Number(values.amount),
      description: values.description.trim(),
      category: values.category as Category,
      date: values.date,
    })
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-type">
          Type
        </label>
        <select id="transaction-type" className="form-field__control" {...register('type')}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-amount">
          Amount
        </label>
        <input
          id="transaction-amount"
          className="form-field__control"
          type="number"
          min="0.01"
          step="0.01"
          {...register('amount')}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? 'transaction-amount-error' : undefined}
        />
        {errors.amount && (
          <p id="transaction-amount-error" className="form-field__error">
            {errors.amount.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-description">
          Description
        </label>
        <input
          id="transaction-description"
          className="form-field__control"
          type="text"
          {...register('description')}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'transaction-description-error' : undefined}
        />
        {errors.description && (
          <p id="transaction-description-error" className="form-field__error">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-category">
          Category
        </label>
        <select
          id="transaction-category"
          className="form-field__control"
          {...register('category')}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? 'transaction-category-error' : undefined}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="transaction-category-error" className="form-field__error">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-date">
          Date
        </label>
        <input
          id="transaction-date"
          className="form-field__control"
          type="date"
          {...register('date')}
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? 'transaction-date-error' : undefined}
        />
        {errors.date && (
          <p id="transaction-date-error" className="form-field__error">
            {errors.date.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="form__server-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="transaction-form__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  )
}
