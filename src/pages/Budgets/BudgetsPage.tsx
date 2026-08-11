import { useState } from 'react'
import type { Budget } from '../../entities/budget/model/types'
import type { BudgetInput } from '../../entities/budget/model/types'
import { BudgetForm } from '../../entities/budget/ui/BudgetForm'
import { BudgetProgress } from '../../entities/budget/ui/BudgetProgress'
import { calculateBudgetUsage, getLatestMonthKey } from '../../analytics/budgets'
import type { BudgetUsage } from '../../analytics/budgets'
import { Modal } from '../../shared/ui/Modal'
import { useBudgets } from '../../shared/hooks/useBudgets'
import { useTransactions } from '../../shared/hooks/useTransactions'
import './BudgetsPage.css'
import '../../shared/ui/form.css'

export function BudgetsPage() {
  const { budgets, addBudget, updateBudget, removeBudget } = useBudgets()
  const { transactions } = useTransactions()
  const [editing, setEditing] = useState<Budget | 'new' | null>(null)

  const month = getLatestMonthKey(transactions)
  const usages = calculateBudgetUsage(transactions, budgets, month)
  const usedCategories = budgets.map((budget) => budget.category)

  const handleSubmit = (input: BudgetInput) => {
    if (editing === 'new') {
      addBudget(input)
    } else if (editing) {
      updateBudget(editing.id, input)
    }
    setEditing(null)
  }

  const handleEdit = (usage: BudgetUsage) => {
    setEditing(usage.budget)
  }

  return (
    <section>
      <div className="budgets-header">
        <h1 className="page-title">Budgets</h1>
        <button type="button" className="button button--primary" onClick={() => setEditing('new')}>
          Add budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No budgets yet</p>
          <p className="empty-state__hint">
            Set a monthly limit for a category and track your spending against it.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setEditing('new')}
          >
            Add budget
          </button>
        </div>
      ) : (
        <div className="budget-grid">
          {usages.map((usage) => (
            <BudgetProgress
              key={usage.budget.id}
              usage={usage}
              onEdit={handleEdit}
              onDelete={removeBudget}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal
          title={editing === 'new' ? 'Add budget' : 'Edit budget'}
          onClose={() => setEditing(null)}
        >
          <BudgetForm
            initialValue={editing === 'new' ? undefined : editing}
            usedCategories={usedCategories}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </section>
  )
}
