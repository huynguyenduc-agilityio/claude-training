import type { AppConfig } from '../../config.ts'
import { roundCents } from '../../shared/money.ts'
import { currentMonthKey, toMonthKey } from '../../shared/time.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import { summarizeMonth } from '../summary/summary.ts'
import { costOf } from '../usage/cost.ts'
import type { NewUsageRecord } from '../usage/usage.ts'
import type { UsageRepository } from '../usage/usage.repository.ts'
import { budgetStatus, type BudgetStatus } from './budget.ts'

export type NotifyBudget = (month: string, status: BudgetStatus) => void

export const WEBHOOK_TIMEOUT_MS = 5000

const LEVEL_RANK: Record<BudgetStatus['level'], number> = { ok: 0, warning: 1, exceeded: 2 }

/** True when the budget level rises: ok to warning, ok to exceeded or warning to exceeded. */
export const crossesThreshold = (before: BudgetStatus, after: BudgetStatus): boolean =>
  LEVEL_RANK[after.level] > LEVEL_RANK[before.level]

const budgetPercent = (status: BudgetStatus): number => Math.floor(status.ratio * 100)

const usd = (amount: number): string => `$${amount.toFixed(2)}`

interface NotifierOptions {
  webhookUrl?: string
  log?: (message: string) => void
  post?: typeof fetch
}

export const createBudgetNotifier =
  ({ webhookUrl, log = console.warn, post = fetch }: NotifierOptions): NotifyBudget =>
  (month, status) => {
    const label = status.level === 'exceeded' ? 'Budget exceeded' : 'Budget warning'
    const percent = budgetPercent(status)
    log(
      `${label}: ${usd(status.spent)} of ${usd(status.budget)} spent in ${month} (${percent}%)`,
    )

    if (!webhookUrl) return
    post(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      body: JSON.stringify({
        month,
        spent: status.spent,
        budget: status.budget,
        percent,
        level: status.level,
      }),
    }).catch((error: Error) => log(`Budget webhook failed: ${error.message}`))
  }

interface AlertDeps {
  repository: UsageRepository
  pricing: PriceTable
  config: AppConfig
  notify: NotifyBudget
}

/**
 * Runs an insert and notifies when it raises the current month's budget level: when spending
 * reaches 80%, and again when it reaches 100%. A jump past both notifies once, as exceeded.
 */
export const createBudgetAlert = ({ repository, pricing, config, notify }: AlertDeps) => {
  const currentStatus = (month: string): BudgetStatus => {
    const { totalCost } = summarizeMonth(repository.listAll(), month, config.timeZone, pricing)
    return budgetStatus(totalCost, config.monthlyBudgetUsd)
  }

  return {
    track: <T extends NewUsageRecord>(insert: () => T): T => {
      const month = currentMonthKey(config.timeZone)
      const before = currentStatus(month)
      const record = insert()
      if (toMonthKey(record.timestamp, config.timeZone) !== month) return record

      const cost = costOf(record, pricing)
      if (cost === null) return record

      const after = budgetStatus(roundCents(before.spent + cost), config.monthlyBudgetUsd)
      if (crossesThreshold(before, after)) notify(month, after)
      return record
    },
  }
}
