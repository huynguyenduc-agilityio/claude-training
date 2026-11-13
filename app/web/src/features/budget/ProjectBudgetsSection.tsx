import { type FormEvent, useState } from 'react'
import {
  deleteProjectBudget,
  type ProjectBudget,
  type ProjectBudgets,
  saveProjectBudget,
} from '../../shared/api.ts'
import { formatUsd } from '../../shared/format.ts'
import { failureMessage, toBudgetAmount } from './budgetForm.ts'

export type ProjectBudgetsSectionState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; month: string; projects: ProjectBudget[] }

export interface ProjectBudgetsSectionProps {
  section: ProjectBudgetsSectionState
  /** The month picked on the dashboard. The budgets are always for the API's `month`. */
  month: string
  /** Reloads only the budgets; resolves with the response, or `null` when it failed. */
  refresh: () => Promise<ProjectBudgets | null>
}

interface RowState {
  /** What was typed. `undefined` means: show the budget as the API returns it. */
  text?: string
  message?: { kind: 'success' | 'error'; text: string }
  pending: boolean
  /** Counts edits, so an answer to an older request does not overwrite newer typing. */
  rev: number
}

const NEW_ROW: RowState = { pending: false, rev: 0 }

const apiText = (entry: ProjectBudget) => (entry.budget === null ? '' : String(entry.budget))

type Action = 'save' | 'remove'

export const ProjectBudgetsSection = ({ section, month, refresh }: ProjectBudgetsSectionProps) => {
  // Kept here, not in the rows, so typed text and messages survive reloads of the data.
  const [rows, setRows] = useState<Record<string, RowState>>({})

  const update = (project: string, change: (row: RowState) => RowState) =>
    setRows((previous) => ({ ...previous, [project]: change(previous[project] ?? NEW_ROW) }))

  const edit = (project: string, text: string) =>
    update(project, (row) => ({ ...row, text, message: undefined, rev: row.rev + 1 }))

  const run = async (project: string, action: Action, typed: string) => {
    const sentRev = (rows[project] ?? NEW_ROW).rev
    // An answer applies to the row only if the field was not edited since the request started.
    const unchanged = (row: RowState) => row.rev === sentRev
    update(project, (row) => ({ ...row, pending: true }))
    try {
      if (action === 'save') await saveProjectBudget(project, toBudgetAmount(typed))
      else await deleteProjectBudget(project)
    } catch (error) {
      const text = failureMessage(error, action)
      update(project, (row) => ({
        ...row,
        pending: false,
        message: unchanged(row) ? { kind: 'error', text } : row.message,
      }))
      return
    }
    update(project, (row) => ({
      ...row,
      pending: false,
      message: unchanged(row)
        ? action === 'save'
          ? { kind: 'success', text: 'Saved' }
          : undefined
        : row.message,
    }))
    const data = await refresh()
    if (data?.projects.some((entry) => entry.project === project)) {
      update(project, (row) => (unchanged(row) ? { ...row, text: undefined } : row))
    }
  }

  const body = () => {
    if (section.status === 'loading') return <p className="muted">Loading project budgets…</p>
    if (section.status === 'error') return <p className="error">Project budgets are unavailable.</p>
    if (section.projects.length === 0) {
      return <p className="muted">No projects have usage records yet.</p>
    }
    return (
      <>
        {month !== section.month && <p className="muted">Spending shown for {section.month}.</p>}
        <div className="budget-rows">
          {section.projects.map((entry) => {
            const row = rows[entry.project] ?? NEW_ROW
            const submit = (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              void run(entry.project, 'save', row.text ?? apiText(entry))
            }
            return (
              <form
                key={entry.project}
                className="budget-row"
                aria-label={entry.project}
                noValidate
                onSubmit={submit}
              >
                <strong className="budget-project">{entry.project}</strong>
                <span className="muted budget-spent">Spent this month: {formatUsd(entry.spent)}</span>
                <input
                  type="number"
                  step="any"
                  aria-label={`Budget for ${entry.project}`}
                  value={row.text ?? apiText(entry)}
                  onChange={(event) => edit(entry.project, event.target.value)}
                />
                <span className="budget-amount">
                  {entry.budget === null ? 'No budget' : formatUsd(entry.budget)}
                </span>
                <button type="submit" disabled={row.pending}>
                  Save
                </button>
                {entry.budget !== null && (
                  <button
                    type="button"
                    disabled={row.pending}
                    onClick={() => void run(entry.project, 'remove', row.text ?? apiText(entry))}
                  >
                    Remove
                  </button>
                )}
                {row.message?.kind === 'success' && (
                  <span className="success">{row.message.text}</span>
                )}
                {row.message?.kind === 'error' && (
                  <span className="error" role="alert">
                    {row.message.text}
                  </span>
                )}
              </form>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <section className="panel">
      <h2>Project budgets</h2>
      {body()}
    </section>
  )
}
