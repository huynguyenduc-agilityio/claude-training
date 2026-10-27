import type { BudgetStatus } from '../../shared/api.ts'
import { formatUsd } from '../../shared/format.ts'

export const BudgetBanner = ({ budget }: { budget: BudgetStatus }) => {
  if (budget.level === 'ok') return null

  const label = budget.level === 'exceeded' ? 'Budget exceeded' : 'Budget warning'

  return (
    <div className={`banner banner-${budget.level}`} role="alert">
      {label}: {formatUsd(budget.spent)} of {formatUsd(budget.budget)} spent this month (
      {Math.floor(budget.ratio * 100)}%).
    </div>
  )
}
