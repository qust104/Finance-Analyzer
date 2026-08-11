import { useBudgets } from '../../shared/hooks/useBudgets'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { ErrorState, LoadingState } from '../../shared/ui/AsyncStates'
import { BudgetOverview } from './BudgetOverview'
import { CashFlowChart } from './CashFlowChart'
import { FinancialInsights } from './FinancialInsights'
import { FinancialSummary } from './FinancialSummary'
import { RecentTransactions } from './RecentTransactions'
import { SpendingByCategory } from './SpendingByCategory'
import './DashboardPage.css'

export function DashboardPage() {
  const { transactions, isPending, isError, refetch } = useTransactions()
  const {
    budgets,
    isPending: budgetsPending,
    isError: budgetsError,
    refetch: refetchBudgets,
  } = useBudgets()

  if (isPending || budgetsPending) {
    return (
      <section>
        <h1 className="page-title">Dashboard</h1>
        <LoadingState />
      </section>
    )
  }

  if (isError || budgetsError) {
    return (
      <section>
        <h1 className="page-title">Dashboard</h1>
        <ErrorState
          onRetry={() => {
            void refetch()
            void refetchBudgets()
          }}
        />
      </section>
    )
  }

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
