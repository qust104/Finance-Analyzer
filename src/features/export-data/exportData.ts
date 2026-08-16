import { isBudget } from '../../entities/budget/model/budgetStorage'
import type { Budget } from '../../entities/budget/model/types'
import { isTransaction } from '../../entities/transaction/model/transactionStorage'
import type { Transaction } from '../../entities/transaction/model/types'

// The backup file format. `version` guards future migrations;
// `exportedAt` is informational only.
export const EXPORT_VERSION = 1

export interface BackupPayload {
  version: typeof EXPORT_VERSION
  exportedAt: string
  transactions: Transaction[]
  budgets: Budget[]
}

export function buildExportPayload(
  transactions: readonly Transaction[],
  budgets: readonly Budget[],
  exportedAt: Date = new Date(),
): BackupPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    transactions: [...transactions],
    budgets: [...budgets],
  }
}

export type ParseBackupResult =
  | { ok: true; value: BackupPayload }
  | { ok: false; error: string }

// Restore input is as untrusted as localStorage: every row goes through
// the same guards the storage layer applies on load.
export function parseExportPayload(raw: unknown): ParseBackupResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Not a valid backup file' }
  }
  const candidate = raw as Record<string, unknown>
  if (candidate.version !== EXPORT_VERSION) {
    return { ok: false, error: `Unsupported backup version: ${String(candidate.version)}` }
  }
  if (!Array.isArray(candidate.transactions) || !Array.isArray(candidate.budgets)) {
    return { ok: false, error: 'Backup must contain transactions and budgets arrays' }
  }

  const transactions = candidate.transactions.filter(isTransaction)
  const budgets = candidate.budgets.filter(isBudget)
  if (transactions.length !== candidate.transactions.length) {
    return { ok: false, error: 'Backup contains invalid transaction rows' }
  }
  if (budgets.length !== candidate.budgets.length) {
    return { ok: false, error: 'Backup contains invalid budget rows' }
  }

  return {
    ok: true,
    value: {
      version: EXPORT_VERSION,
      exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
      transactions,
      budgets,
    },
  }
}

export function backupFilename(exportedAt: Date = new Date()): string {
  const stamp = exportedAt.toISOString().slice(0, 10)
  return `finance-analyzer-backup-${stamp}.json`
}

export function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename(new Date(payload.exportedAt))
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsText(file)
  })
}