export type BudgetLevel = 'ok' | 'warning' | 'exceeded'

export interface BudgetStatus {
  spent: number
  budget: number
  /** spent / budget, 0 when no budget is set */
  ratio: number
  level: BudgetLevel
}

export const WARNING_RATIO = 0.8

export const budgetStatus = (spent: number, budget: number): BudgetStatus => {
  const ratio = budget > 0 ? spent / budget : 0
  const level: BudgetLevel =
    budget > 0 && ratio >= 1 ? 'exceeded' : ratio >= WARNING_RATIO ? 'warning' : 'ok'
  return { spent, budget, ratio, level }
}
