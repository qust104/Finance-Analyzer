import { useRef, useState } from 'react'
import { restoreData } from '../../api/data'
import {
  buildExportPayload,
  downloadBackup,
  parseExportPayload,
  readBackupFile,
} from '../../features/export-data/exportData'
import { useBudgets } from '../../shared/hooks/useBudgets'
import { useCategories } from '../../shared/hooks/useCategories'
import { useRecurring } from '../../shared/hooks/useRecurring'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { PageContainer } from '../../shared/ui/PageContainer'
import './SettingsPage.css'

export function SettingsPage() {
  const { transactions, isPending: transactionsPending, refetch: refetchTransactions } =
    useTransactions()
  const { budgets, isPending: budgetsPending, refetch: refetchBudgets } = useBudgets()
  const { categories, isPending: categoriesPending, refetch: refetchCategories } = useCategories()
  const { recurring, isPending: recurringPending, refetch: refetchRecurring } = useRecurring()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreDone, setRestoreDone] = useState(false)

  const handleExport = () => {
    downloadBackup(buildExportPayload(transactions, budgets, categories, recurring))
  }

  const handleRestore = async (file: File | undefined) => {
    if (!file) return
    setRestoreError(null)
    setRestoreDone(false)

    let fileName: string
    try {
      fileName = await readBackupFile(file)
    } catch {
      setRestoreError('Could not read the file')
      return
    }

    let parsed: ReturnType<typeof parseExportPayload>
    try {
      parsed = parseExportPayload(JSON.parse(fileName) as unknown)
    } catch {
      setRestoreError('Not a valid backup file')
      return
    }
    if (!parsed.ok) {
      setRestoreError(parsed.error)
      return
    }

    const payload = parsed.value
    const confirmed = window.confirm(
      `Replace all current data with ${payload.transactions.length} transactions and ${payload.budgets.length} budgets? This cannot be undone.`,
    )
    if (!confirmed) return

    try {
      setRestoring(true)
      await restoreData(payload.transactions, payload.budgets, payload.categories, payload.recurring)
      refetchTransactions()
      refetchBudgets()
      refetchCategories()
      refetchRecurring()
      setRestoreDone(true)
    } catch {
      setRestoreError('Restore failed. Your data was not changed.')
    } finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const dataReady = !transactionsPending && !budgetsPending && !categoriesPending && !recurringPending

  return (
    <PageContainer title="Settings">
      <div className="settings-card">
        <h2 className="settings-card__title">Backup &amp; Restore</h2>
        <p className="settings-card__hint">
          Export your data as a JSON file or restore it from a previous backup. Restoring replaces
          everything.
        </p>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-actions__button"
            onClick={handleExport}
            disabled={!dataReady}
          >
            Export data
          </button>
          <label className="settings-actions__button settings-actions__button--secondary">
            Restore from file
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="settings-actions__file"
              onChange={(event) => void handleRestore(event.target.files?.[0])}
            />
          </label>
        </div>

        {restoring && <p role="status" className="settings-message">Restoring…</p>}
        {restoreError && <p role="alert" className="settings-message settings-message--error">{restoreError}</p>}
        {restoreDone && (
          <p role="status" className="settings-message settings-message--success">
            Backup restored. All data was replaced.
          </p>
        )}
      </div>
    </PageContainer>
  )
}