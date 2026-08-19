import { useMemo, useState } from 'react'
import { CategoryForm } from '../../entities/category/ui/CategoryForm'
import type { CategoryInput } from '../../entities/category/model/types'
import { Modal } from '../../shared/ui/Modal'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { useCategories } from '../../shared/hooks/useCategories'
import './CategoriesPage.css'
import '../../shared/ui/form.css'

export function CategoriesPage() {
  const {
    categories,
    isPending,
    isError,
    refetch,
    saveState,
    addCategory,
    updateCategory,
    removeCategory,
  } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const editing = useMemo(
    () => categories.find((category) => category.key === editingKey) ?? null,
    [categories, editingKey],
  )

  const openCreate = () => {
    setEditingKey(null)
    setFormOpen(true)
  }

  const openEdit = (key: string) => {
    setEditingKey(key)
    setDeleteError(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingKey(null)
  }

  const handleSubmit = async (input: CategoryInput) => {
    try {
      if (editing) {
        await updateCategory(editing.key, input)
      } else {
        await addCategory(input)
      }
      closeForm()
    } catch {
      // saveState.error explains the failure; the form stays open.
    }
  }

  const handleDelete = async (key: string) => {
    try {
      await removeCategory(key)
      setDeleteError(null)
    } catch (error) {
      setDeleteError((error as Error).message)
    }
  }

  if (isPending) {
    return (
      <section>
        <LoadingState />
      </section>
    )
  }

  if (isError && categories.length === 0) {
    return (
      <section>
        <ErrorState onRetry={refetch} />
      </section>
    )
  }

  return (
    <section>
      <div className="categories-header">
        <button type="button" className="button button--primary" onClick={openCreate}>
          Add category
        </button>
      </div>

      {deleteError && (
        <p className="categories-error" role="alert">
          {deleteError}
        </p>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No categories yet</p>
          <p className="empty-state__hint">
            Create categories to group income and expenses beyond the built-in set.
          </p>
          <button type="button" className="button button--primary" onClick={openCreate}>
            Add category
          </button>
        </div>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.key} className="category-list__item">
              <span className="category-list__swatch" style={{ background: category.color }} />
              <span className="category-list__name">{category.label}</span>
              {category.builtin && (
                <span className="category-list__badge">built-in</span>
              )}
              {category.aliases.length > 0 && (
                <span className="category-list__aliases">aliases: {category.aliases.join(', ')}</span>
              )}
              <span className="category-list__actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => openEdit(category.key)}
                >
                  Edit
                </button>
                {!category.builtin && (
                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => void handleDelete(category.key)}
                  >
                    Delete
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <Modal
          title={editing ? 'Edit category' : 'Add category'}
          onClose={closeForm}
        >
          <CategoryForm
            initialValue={editing ?? undefined}
            submitError={saveState.error}
            isSubmitting={saveState.isPending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </section>
  )
}