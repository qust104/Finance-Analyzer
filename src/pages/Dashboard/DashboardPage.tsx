import { useBudgets } from '../../shared/hooks/useBudgets'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { BudgetOverview } from './BudgetOverview'
import { CashFlowChart } from './CashFlowChart'
import { FinancialInsights } from './FinancialInsights'
import { FinancialSummary } from './FinancialSummary'
import { RecentTransactions } from './RecentTransactions'
import { SpendingByCategory } from './SpendingByCategory'
import './DashboardPage.css'

export function DashboardPage() {
  const { transactions } = useTransactions()
  const { budgets } = useBudgets()

  return (
    <section>
      <h1 className="page-title">Dashboard</h1>
      <FinancialSummary transactions={transactions} />
      <div className="dashboard-grid">
        <CashFlowChart transactions={transactions} />
        <SpendingByCategory transactions={transactions} />
        <BudgetOverview transactions={transactions} budgets={budgets} />
        <RecentTransactions transactions={transactions} />
      </div>
      <div className="dashboard-insights">
        <FinancialInsights transactions={transactions} budgets={budgets} />
      </div>
    </section>
  )
}
