import type { BudgetInput } from '../../entities/budget/model/types'
import { BudgetForm } from '../../entities/budget/ui/BudgetForm'
import { BudgetProgress } from '../../entities/budget/ui/BudgetProgress'
import { calculateBudgetUsage } from '../../analytics/budgets'
import type { BudgetUsage } from '../../analytics/budgets'
import { Modal } from '../../shared/ui/Modal'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { ReportMonthBanner } from '../../shared/ui/ReportMonthBanner'
import { Toast } from '../../shared/ui/Toast'
import { useBudgets } from '../../shared/hooks/useBudgets'
import { useCategories } from '../../shared/hooks/useCategories'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useReportMonth } from '../../shared/hooks/useReportMonth'
import { useUndoableDelete } from '../../shared/hooks/useUndoableDelete'
import { useUiStore } from '../../shared/store/uiStore'
import './BudgetsPage.css'
import '../../shared/ui/form.css'

export function BudgetsPage() {
  const { budgets, addBudget, updateBudget, removeBudget, isPending, isError, refetch, saveState } =
    useBudgets()
  const { transactions } = useTransactions()
  const { categories } = useCategories()
  const editing = useUiStore((state) => state.budgetForm)
  const openBudgetForm = useUiStore((state) => state.openBudgetForm)
  const closeBudgetForm = useUiStore((state) => state.closeBudgetForm)

  const { month, isFallback } = useReportMonth(transactions)
  const { requestDelete, restorePending, clearUndo, pendingUndo } = useUndoableDelete({
    message: 'Budget deleted',
    remove: removeBudget,
    find: (id) => budgets.find((budget) => budget.id === id),
    restore: (budget) =>
      addBudget({ category: budget.category, amount: budget.amount, period: budget.period }),
  })
  const usages = calculateBudgetUsage(transactions, budgets, month)
  const usedCategories = budgets.map((budget) => budget.category)

  if (isPending) {
    return (
      <section>
        <h1 className="page-title">Budgets</h1>
        <LoadingState />
      </section>
    )
  }

  if (isError && budgets.length === 0) {
    return (
      <section>
        <h1 className="page-title">Budgets</h1>
        <ErrorState onRetry={refetch} />
      </section>
    )
  }

  const handleSubmit = async (input: BudgetInput) => {
    try {
      if (editing === 'new') {
        await addBudget(input)
      } else if (editing) {
        await updateBudget(editing.id, input)
      }
      closeBudgetForm()
    } catch {
      // The mutation failed: saveState.error explains why and the form
      // stays open, so the user can fix the input and resubmit.
    }
  }

  const handleEdit = (usage: BudgetUsage) => {
    openBudgetForm(usage.budget)
  }

  return (
    <section>
      <div className="budgets-header">
        <h1 className="page-title">Budgets</h1>
        <button
          type="button"
          className="button button--primary"
          onClick={() => openBudgetForm('new')}
        >
          Add budget
        </button>
      </div>

      {isFallback && <ReportMonthBanner month={month} />}

      {budgets.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No budgets yet</p>
          <p className="empty-state__hint">
            Set a monthly limit for a category and track your spending against it.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => openBudgetForm('new')}
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
              categories={categories}
              onEdit={handleEdit}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing === 'new' ? 'Add budget' : 'Edit budget'} onClose={closeBudgetForm}>
          <BudgetForm
            initialValue={editing === 'new' ? undefined : editing}
            categories={categories}
            usedCategories={usedCategories}
            submitError={saveState.error}
            isSubmitting={saveState.isPending}
            onSubmit={handleSubmit}
            onCancel={closeBudgetForm}
          />
        </Modal>
      )}

      {pendingUndo !== null && (
        <Toast
          message={pendingUndo.message}
          onUndo={() => restorePending(pendingUndo.item)}
          onClose={clearUndo}
        />
      )}
    </section>
  )
}
