import type { ProjectBudget } from '../../shared/api.ts'

const toCents = (amount: number): number => Math.round(amount * 100)

/** Compares by code point (not UTF-16 unit, not locale), so uppercase comes first. */
const compareCodePoints = (a: string, b: string): number => {
  const left = Array.from(a)
  const right = Array.from(b)
  const length = Math.min(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] as string).codePointAt(0)! - (right[index] as string).codePointAt(0)!
    if (difference !== 0) return difference
  }
  return left.length - right.length
}

const hasBanner = (entry: ProjectBudget): boolean =>
  entry.level === 'warning' || entry.level === 'exceeded'

/**
 * Share spent against the budget, compared by cross-multiplying whole cents: s1 × b2 vs s2 × b1.
 * The products are BigInt: above 2^53 JavaScript numbers round and two shares could look equal.
 */
const compareShares = (a: ProjectBudget, b: ProjectBudget): number => {
  const left = BigInt(toCents(b.spent)) * BigInt(toCents(a.budget ?? 0))
  const right = BigInt(toCents(a.spent)) * BigInt(toCents(b.budget ?? 0))
  return left > right ? 1 : left < right ? -1 : 0
}

/**
 * The projects that get a banner, in display order: exceeded before warning, then the higher share
 * first, then project name. The levels come from the API; this only orders.
 */
export const bannerProjects = (projects: ProjectBudget[]): ProjectBudget[] =>
  projects.filter(hasBanner).sort((a, b) => {
    if (a.level !== b.level) return a.level === 'exceeded' ? -1 : 1
    return compareShares(a, b) || compareCodePoints(a.project, b.project)
  })
