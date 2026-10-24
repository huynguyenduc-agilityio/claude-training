import { roundCents } from '../../shared/money.ts'
import { getPrice, type PriceTable } from '../pricing/pricing.ts'
import { calculateCost } from '../usage/cost.ts'
import { recordsInMonth } from '../usage/usage.query.ts'
import type { UsageRecord } from '../usage/usage.ts'

export interface Breakdown {
  key: string
  cost: number
  records: number
}

export interface MonthlySummary {
  month: string
  totalCost: number
  recordCount: number
  byModel: Breakdown[]
  byProject: Breakdown[]
}

const groupCost = (
  priced: { record: UsageRecord; cost: number }[],
  keyOf: (record: UsageRecord) => string,
): Breakdown[] => {
  const groups = new Map<string, Breakdown>()
  for (const { record, cost } of priced) {
    const key = keyOf(record)
    const group = groups.get(key) ?? { key, cost: 0, records: 0 }
    group.cost += cost
    group.records += 1
    groups.set(key, group)
  }
  return [...groups.values()]
    .map((group) => ({ ...group, cost: roundCents(group.cost) }))
    .sort((a, b) => b.cost - a.cost)
}

/** Totals and breakdowns for one `YYYY-MM` month in the configured time zone. */
export const summarizeMonth = (
  records: UsageRecord[],
  month: string,
  timeZone: string,
  pricing: PriceTable,
): MonthlySummary => {
  const priced = recordsInMonth(records, month, timeZone).map((record) => ({
    record,
    cost: calculateCost(record, getPrice(pricing, record.model, record.timestamp)),
  }))

  const total = priced.reduce((sum, { cost }) => sum + cost, 0)

  return {
    month,
    totalCost: roundCents(total),
    recordCount: priced.length,
    byModel: groupCost(priced, (record) => record.model),
    byProject: groupCost(priced, (record) => record.project),
  }
}
