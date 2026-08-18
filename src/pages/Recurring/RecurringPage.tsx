import { useMemo, useState } from 'react'
import { categoryColorOf, categoryLabelOf } from '../../entities/category/model/catalog'
import { RecurringForm } from '../../entities/recurring/ui/RecurringForm'
import type { RecurringInput } from '../../entities/recurring/model/types'
import { upcomingScheduledDate } from '../../features/recurring/schedule'
import { Modal } from '../../shared/ui/Modal'
import { Toast } from '../../shared/ui/Toast'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { formatCurrency } from '../../shared/lib/format'
import { useCategories } from '../../shared/hooks/useCategories'
import { useRecurring } from '../../shared/hooks/useRecurring'
import { useUndoableDelete } from '../../shared/hooks/useUndoableDelete'
import './RecurringPage.css'
import '../../shared/ui/form.css'

function localToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function intervalLabel(interval: string): string {
  return interval.charAt(0).toUpperCase() + interval.slice(1)
}

export function RecurringPage() {
  const { recurring, addRecurring, updateRecurring, removeRecurring, restoreRecurring, isPending, isError, refetch, saveState } =
    useRecurring()
  const { categories } = useCategories()
  const { requestDelete, restorePending, clearUndo, pendingUndo } = useUndoableDelete({
    message: 'Recurring template deleted',
    remove: removeRecurring,
    restore: restoreRecurring,
    find: (id) => recurring.find((template) => template.id === id),
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = useMemo(
    () => recurring.find((template) => template.id === editingId) ?? null,
    [recurring, editingId],
  )

  const openCreate = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async (input: RecurringInput) => {
    try {
      if (editing) {
        await updateRecurring(editing.id, input)
      } else {
        await addRecurring(input)
      }
      closeForm()
    } catch {
      // saveState.error explains the failure; the form stays open.
    }
  }

  if (isPending) {
    return (
      <section>
        <LoadingState />
      </section>
    )
  }

  if (isError && recurring.length === 0) {
    return (
      <section>
        <ErrorState onRetry={refetch} />
      </section>
    )
  }

  const today = localToday()

  return (
    <section>
      <div className="recurring-header">
        <button type="button" className="button button--primary" onClick={openCreate}>
          Add template
        </button>
      </div>

      <p className="recurring-intro">
        Recurring templates post their due transactions automatically when the app opens.
        Old periods are backfilled over the most recent repeats.
      </p>

      {recurring.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No recurring templates yet</p>
          <p className="empty-state__hint">
            Salary, rent, subscriptions — create a template and its transactions will appear on
            schedule.
          </p>
          <button type="button" className="button button--primary" onClick={openCreate}>
            Add template
          </button>
        </div>
      ) : (
        <ul className="recurring-list">
          {recurring.map((template) => {
            const next = upcomingScheduledDate(template, today)
            return (
              <li
                key={template.id}
                className={`recurring-list__item${!template.active ? ' recurring-list__item--paused' : ''}`}
              >
                <div className="recurring-list__swatch" style={{ background: categoryColorOf(categories, template.category) }} />
                <div className="recurring-list__body">
                  <div className="recurring-list__row">
                    <span className="recurring-list__name">
                      {template.description}
                      {!template.active && (
                        <span className="recurring-list__badge">paused</span>
                      )}
                    </span>
                    <span className={`recurring-list__amount recurring-list__amount--${template.type}`}>
                      {template.type === 'income' ? '+' : '−'}
                      {formatCurrency(template.amount)}
                    </span>
                  </div>
                  <div className="recurring-list__meta">
                    {categoryLabelOf(categories, template.category)} · {intervalLabel(template.interval)}
                    {' · '}
                    {next === null ? 'No more occurrences' : `Next: ${next}`}
                    {template.endDate !== null && ` · until ${template.endDate}`}
                  </div>
                </div>
                <div className="recurring-list__actions">
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => openEdit(template.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => requestDelete(template.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {formOpen && (
        <Modal title={editing ? 'Edit template' : 'Add template'} onClose={closeForm}>
          <RecurringForm
            initialValue={editing ?? undefined}
            categories={categories}
            submitError={saveState.error}
            isSubmitting={saveState.isPending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
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