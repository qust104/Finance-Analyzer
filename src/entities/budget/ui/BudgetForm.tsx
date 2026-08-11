import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Budget } from '../model/types'
import type { BudgetInput } from '../model/types'
import { ALL_CATEGORIES, CATEGORY_LABELS } from '../../transaction/model/types'
import type { Category } from '../../transaction/model/types'
import './BudgetForm.css'
import '../../../shared/ui/form.css'

interface BudgetFormProps {
  initialValue?: Budget
  // Categories that already have a budget and are not available for new ones.
  usedCategories: Category[]
  onSubmit: (input: BudgetInput) => void
  onCancel: () => void
}

export function BudgetForm({ initialValue, usedCategories, onSubmit, onCancel }: BudgetFormProps) {
  const [category, setCategory] = useState<Category | ''>(initialValue?.category ?? '')
  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : '')
  const [error, setError] = useState<{ category?: string; amount?: string }>({})

  const availableCategories = ALL_CATEGORIES.filter(
    (item) => !usedCategories.includes(item) || item === initialValue?.category,
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextError: { category?: string; amount?: string } = {}

    if (category === '') {
      nextError.category = 'Category is required'
    }
    const numericAmount = Number(amount)
    if (amount.trim() === '' || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextError.amount = 'Amount must be a positive number'
    }

    if (Object.keys(nextError).length > 0) {
      setError(nextError)
      return
    }

    onSubmit({ category: category as Category, amount: numericAmount, period: 'monthly' })
  }

  return (
    <form className="budget-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-field__label" htmlFor="budget-category">
          Category
        </label>
        <select
          id="budget-category"
          className="form-field__control"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category | '')}
          disabled={initialValue !== undefined}
          aria-invalid={error.category ? true : undefined}
          aria-describedby={error.category ? 'budget-category-error' : undefined}
        >
          <option value="">Select category</option>
          {availableCategories.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        {error.category && (
          <p id="budget-category-error" className="form-field__error">
            {error.category}
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
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={error.amount ? true : undefined}
          aria-describedby={error.amount ? 'budget-amount-error' : undefined}
        />
        {error.amount && (
          <p id="budget-amount-error" className="form-field__error">
            {error.amount}
          </p>
        )}
      </div>

      <div className="budget-form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary">
          {initialValue ? 'Save changes' : 'Add budget'}
        </button>
      </div>
    </form>
  )
}
