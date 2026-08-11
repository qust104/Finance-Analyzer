import { useTransactions } from '../../shared/hooks/useTransactions'
import { CashFlowChart } from './CashFlowChart'
import { FinancialSummary } from './FinancialSummary'
import { RecentTransactions } from './RecentTransactions'
import { SpendingByCategory } from './SpendingByCategory'
import './DashboardPage.css'

export function DashboardPage() {
  const { transactions } = useTransactions()

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <FinancialSummary transactions={transactions} />
      <div className="dashboard-grid">
        <CashFlowChart transactions={transactions} />
        <SpendingByCategory transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>
    </section>
  )
}
