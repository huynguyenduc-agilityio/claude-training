import { ValidationError } from '../../shared/errors.ts'
import { roundCents } from '../../shared/money.ts'

export const MAX_BUDGET_USD = 1_000_000

/**
 * Checks a `PUT /api/project-budgets/:project` body and returns the budget in USD rounded to
 * cents. The first failing check gives the error: finite number, at least 1 cent, at most
 * 1000000, at most 2 decimals.
 */
export const parseBudgetUsd = (body: unknown): number => {
  const value =
    typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).budgetUsd
      : undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError('budgetUsd must be a number')
  }
  const cents = value * 100
  if (Math.round(cents) < 1) throw new ValidationError('budgetUsd must be greater than 0')
  if (value > MAX_BUDGET_USD) throw new ValidationError('budgetUsd must be at most 1000000')
  // The tolerance grows with the amount: above about $131 072, float error in `value × 100`
  // is larger than 1e-9, so a fixed 1e-9 would reject valid 2-decimal amounts.
  const tolerance = Math.max(1e-9, 4 * Number.EPSILON * Math.abs(cents))
  if (Math.abs(cents - Math.round(cents)) > tolerance) {
    throw new ValidationError('budgetUsd must have at most 2 decimals')
  }
  return roundCents(value)
}
