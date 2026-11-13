import type { ProjectBudget } from '../../shared/api.ts'
import { formatUsd } from '../../shared/format.ts'
import { bannerProjects } from './projectBudgetOrder.ts'

export type ProjectBudgetsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: ProjectBudget[] }

export const ProjectBudgetBanners = ({ state }: { state: ProjectBudgetsState }) => {
  if (state.status === 'loading') return null
  if (state.status === 'error') {
    return <p className="error">Could not load project budgets: {state.message}</p>
  }

  return (
    <>
      {bannerProjects(state.projects).map((entry) => (
        <div key={entry.project} className={`banner banner-${entry.level}`} role="alert">
          {entry.level === 'exceeded' ? 'Budget exceeded' : 'Budget warning'} for {entry.project}:{' '}
          {formatUsd(entry.spent)} of {formatUsd(entry.budget ?? 0)} spent this month ({entry.percent}
          %).
        </div>
      ))}
    </>
  )
}
