import type { PriceTable } from '../pricing/pricing.ts'
import { summarizeMonth } from '../summary/summary.ts'
import type { UsageRecord } from '../usage/usage.ts'

export type ProjectBudgetLevel = 'none' | 'ok' | 'warning' | 'exceeded'

export interface ProjectBudgetEntry {
  project: string
  budget: number | null
  spent: number
  /** spent / budget for information only, not rounded; null without a budget */
  ratio: number | null
  /** floor(100 × spent / budget) in whole cents; null without a budget */
  percent: number | null
  level: ProjectBudgetLevel
}

const toCents = (usd: number): number => Math.round(usd * 100)

/**
 * Budget status of one project. `percent` and `level` are computed in whole cents so float
 * error cannot move a boundary: with `s` the spent cents and `b` the budget cents, `warning`
 * is `100 s ≥ 80 b` and `exceeded` is `s ≥ b`.
 */
export const projectBudgetEntry = (
  project: string,
  spent: number,
  budget: number | null,
): ProjectBudgetEntry => {
  if (budget === null) {
    return { project, budget: null, spent, ratio: null, percent: null, level: 'none' }
  }
  const s = toCents(spent)
  const b = toCents(budget)
  const scaled = 100 * s
  const level: ProjectBudgetLevel = s >= b ? 'exceeded' : scaled >= 80 * b ? 'warning' : 'ok'
  return {
    project,
    budget,
    spent,
    ratio: spent / budget,
    percent: (scaled - (scaled % b)) / b,
    level,
  }
}

const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** Every project that has a usage record in any month, with its status for `month`. */
export const listProjectBudgets = (
  records: UsageRecord[],
  budgets: ReadonlyMap<string, number>,
  month: string,
  timeZone: string,
  pricing: PriceTable,
): ProjectBudgetEntry[] => {
  const spentByProject = new Map(
    summarizeMonth(records, month, timeZone, pricing).byProject.map(({ key, cost }) => [key, cost]),
  )
  const projects = [...new Set(records.map((record) => record.project))].sort(byCodePoint)
  return projects.map((project) =>
    projectBudgetEntry(project, spentByProject.get(project) ?? 0, budgets.get(project) ?? null),
  )
}
