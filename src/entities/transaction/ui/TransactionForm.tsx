import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category, Transaction } from '../model/types'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '../model/types'
import type { TransactionInput } from '../model/repository'
import { validateTransactionForm } from '../model/validation'
import type { TransactionFormErrors } from '../model/validation'
import './TransactionForm.css'
import '../../../shared/ui/form.css'

interface TransactionFormProps {
  initialValue?: Transaction
  onSubmit: (input: TransactionInput) => void
  onCancel: () => void
}

export function TransactionForm({ initialValue, onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(initialValue?.type ?? 'expense')
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [category, setCategory] = useState<Category | ''>(initialValue?.category ?? '')
  const [date, setDate] = useState(initialValue?.date ?? '')
  const [errors, setErrors] = useState<TransactionFormErrors>({})

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const formErrors = validateTransactionForm({ type, amount, description, category, date })
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    onSubmit({
      type,
      amount: Number(amount),
      description: description.trim(),
      category: category as Category,
      date,
    })
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="transaction-type">
          Type
        </label>
        <select
          id="transaction-type"
          className="form-field__control"
          value={type}
          onChange={(event) => setType(event.target.value as 'income' | 'expense')}
        >
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
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? 'transaction-amount-error' : undefined}
        />
        {errors.amount && (
          <p id="transaction-amount-error" className="form-field__error">
            {errors.amount}
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'transaction-description-error' : undefined}
        />
        {errors.description && (
          <p id="transaction-description-error" className="form-field__error">
            {errors.description}
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
          value={category}
          onChange={(event) => setCategory(event.target.value as Category | '')}
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={errors.category ? 'transaction-category-error' : undefined}
        >
          <option value="">Select category</option>
          {ALL_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="transaction-category-error" className="form-field__error">
            {errors.category}
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
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? 'transaction-date-error' : undefined}
        />
        {errors.date && (
          <p id="transaction-date-error" className="form-field__error">
            {errors.date}
          </p>
        )}
      </div>

      <div className="transaction-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary">
          {initialValue ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  )
}
