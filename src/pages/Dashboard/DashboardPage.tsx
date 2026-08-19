import { Info } from 'lucide-react'
import { useBudgets } from '../../shared/hooks/useBudgets'
import { useCategories } from '../../shared/hooks/useCategories'
import { useTransactions } from '../../shared/hooks/useTransactions'
import { useProfile } from '../../shared/hooks/useProfile'
import { resolveReportMonth } from '../../analytics/budgets'
import { previousMonthKey } from '../../analytics/comparison'
import { formatMonthKey } from '../../shared/lib/format'
import { useUiStore } from '../../shared/store/uiStore'
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
  const { categories, isPending: categoriesPending } = useCategories()
  const { profile } = useProfile()
  const reportMonth = useUiStore((state) => state.reportMonth)
  const month = reportMonth ?? resolveReportMonth(transactions).month
  const previousMonth = previousMonthKey(month)

  if (isPending || budgetsPending || categoriesPending) {
    return (
      <section>
        <LoadingState />
      </section>
    )
  }

  if ((isError && transactions.length === 0) || (budgetsError && budgets.length === 0)) {
    return (
      <section>
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
      <div className="welcome">
        <h2 className="welcome__greeting">Good afternoon, {profile.displayName} 👋</h2>
        <p className="welcome__subtitle">Here&apos;s how your finances are looking this month.</p>
        <p className="welcome__compare">
          {formatMonthKey(month)} vs. {previousMonth ? formatMonthKey(previousMonth) : 'last month'}
          <span
            className="welcome__info"
            title="The metric cards below compare the selected month against the previous one."
          >
            <Info size={14} aria-hidden="true" />
            <span className="sr-only">The metric cards below compare the selected month against the previous one.</span>
          </span>
        </p>
      </div>
      <FinancialSummary transactions={transactions} month={month} />
      <div className="dashboard-grid">
        <CashFlowChart transactions={transactions} />
        <SpendingByCategory transactions={transactions} categories={categories} month={month} />
        <BudgetOverview
          transactions={transactions}
          budgets={budgets}
          categories={categories}
          month={month}
        />
        <RecentTransactions transactions={transactions} categories={categories} />
      </div>
      <div className="dashboard-insights">
        <FinancialInsights transactions={transactions} budgets={budgets} month={month} />
      </div>
    </section>
  )
}
