import type { MonthlySummary } from '../../shared/api.ts'
import { formatUsd } from '../../shared/format.ts'

const LEVEL_LABEL = { ok: 'On track', warning: 'Over 80%', exceeded: 'Exceeded' } as const

export const SummaryCards = ({ summary }: { summary: MonthlySummary }) => {
  const { budget } = summary
  const percent = Math.min(budget.ratio * 100, 100)

  return (
    <section className="cards">
      <article className="card">
        <h2>Total cost</h2>
        <p className="big">{formatUsd(summary.totalCost)}</p>
      </article>
      <article className="card">
        <h2>Requests</h2>
        <p className="big">{summary.recordCount}</p>
      </article>
      <article className={`card budget budget-${budget.level}`}>
        <h2>Budget {formatUsd(budget.budget, 0)}</h2>
        <p className="big">{Math.round(budget.ratio * 100)}%</p>
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${percent}%` }} />
        </div>
        <p className="muted">{LEVEL_LABEL[budget.level]}</p>
      </article>
    </section>
  )
}
