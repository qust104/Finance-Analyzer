import { useCallback } from 'react'
import type { TransactionInput } from '../model/repository'
import { useCategories } from '../../../shared/hooks/useCategories'
import { useTransactions } from '../../../shared/hooks/useTransactions'
import { Modal } from '../../../shared/ui/Modal'
import { useUiStore } from '../../../shared/store/uiStore'
import { TransactionForm } from './TransactionForm'

// The add/edit dialog is owned by the layout so the "Add transaction"
// button in the app header works from any page. The store decides which
// target (new or an existing transaction id) the form edits.
export function TransactionFormModal() {
  const editing = useUiStore((state) => state.transactionForm)
  const closeTransactionForm = useUiStore((state) => state.closeTransactionForm)
  const { categories } = useCategories()
  const { addTransaction, updateTransaction, saveState } = useTransactions()

  const handleSubmit = useCallback(
    async (input: TransactionInput) => {
      try {
        if (editing === 'new') {
          await addTransaction(input)
        } else if (editing) {
          await updateTransaction(editing.id, input)
        }
        closeTransactionForm()
      } catch {
        // saveState.error explains the failure, the form stays open.
      }
    },
    [editing, addTransaction, updateTransaction, closeTransactionForm],
  )

  if (editing === null) {
    return null
  }

  return (
    <Modal
      title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}
      onClose={closeTransactionForm}
    >
      <TransactionForm
        initialValue={editing === 'new' ? undefined : editing}
        categories={categories}
        submitError={saveState.error}
        isSubmitting={saveState.isPending}
        onSubmit={handleSubmit}
        onCancel={closeTransactionForm}
      />
    </Modal>
  )
}