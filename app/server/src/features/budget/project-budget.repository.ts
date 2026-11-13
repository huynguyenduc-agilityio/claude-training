import type { DatabaseSync } from 'node:sqlite'

interface BudgetRow {
  project: string
  budget_cents: number
}

export interface ProjectBudgetRepository {
  /** Every project budget in USD, keyed by project name. */
  list: () => Map<string, number>
  /** Stores or replaces the budget of a project, in USD, kept as whole cents. */
  set: (project: string, budgetUsd: number) => void
  /** Removes the budget of a project; does nothing when none is set. */
  remove: (project: string) => void
  clear: () => void
}

export const createProjectBudgetRepository = (db: DatabaseSync): ProjectBudgetRepository => {
  const listStatement = db.prepare('SELECT project, budget_cents FROM project_budgets')
  const setStatement = db.prepare(
    `INSERT INTO project_budgets (project, budget_cents) VALUES (?, ?)
     ON CONFLICT(project) DO UPDATE SET budget_cents = excluded.budget_cents`,
  )
  const removeStatement = db.prepare('DELETE FROM project_budgets WHERE project = ?')

  return {
    list: () =>
      new Map(
        (listStatement.all() as unknown as BudgetRow[]).map((row) => [
          row.project,
          row.budget_cents / 100,
        ]),
      ),
    set: (project, budgetUsd) => {
      setStatement.run(project, Math.round(budgetUsd * 100))
    },
    remove: (project) => {
      removeStatement.run(project)
    },
    clear: () => {
      db.exec('DELETE FROM project_budgets')
    },
  }
}
