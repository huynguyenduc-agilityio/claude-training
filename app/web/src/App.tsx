import { useEffect, useState } from 'react'
import { ProjectBudgetBanners } from './features/budget/ProjectBudgetBanners.tsx'
import { useProjectBudgets } from './features/budget/useProjectBudgets.ts'
import { BreakdownTable } from './features/summary/BreakdownTable.tsx'
import { BudgetBanner } from './features/summary/BudgetBanner.tsx'
import { SummaryCards } from './features/summary/SummaryCards.tsx'
import { UnpricedBanner } from './features/summary/UnpricedBanner.tsx'
import { AddUsageForm } from './features/usage/AddUsageForm.tsx'
import { RecordsTable } from './features/usage/RecordsTable.tsx'
import { fetchSummary, fetchUsage, type MonthlySummary, type MonthlyUsage } from './shared/api.ts'
import { thisMonth } from './shared/format.ts'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: MonthlySummary; usage: MonthlyUsage }

export const App = () => {
  const [month, setMonth] = useState(thisMonth())
  const [state, setState] = useState<State>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([fetchSummary(month), fetchUsage(month)])
      .then(([summary, usage]) => {
        if (!cancelled) setState({ status: 'ready', summary, usage })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [month, reloadKey])

  const projectBudgets = useProjectBudgets(reloadKey)

  return (
    <main className="page">
      <header className="header">
        <h1>AI Usage &amp; Cost Tracker</h1>
        <label>
          Month{' '}
          <input
            type="month"
            value={month}
            onChange={(event) => event.target.value && setMonth(event.target.value)}
          />
        </label>
      </header>

      <AddUsageForm onAdded={() => setReloadKey((key) => key + 1)} />

      {state.status === 'loading' && <p className="muted">Loading…</p>}
      {state.status === 'error' && <p className="error">Could not load data: {state.message}</p>}
      {state.status === 'ready' && (
        <>
          {state.summary.isCurrentMonth && (
            <>
              <BudgetBanner budget={state.summary.budget} />
              <ProjectBudgetBanners state={projectBudgets} />
            </>
          )}
          <UnpricedBanner count={state.summary.unpricedCount} />
          <SummaryCards summary={state.summary} />
          <div className="grid">
            <BreakdownTable title="By model" rows={state.summary.byModel} />
            <BreakdownTable title="By project" rows={state.summary.byProject} />
          </div>
          <RecordsTable usage={state.usage} />
        </>
      )}
    </main>
  )
}
