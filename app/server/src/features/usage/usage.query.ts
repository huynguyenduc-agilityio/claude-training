import { roundCents } from '../../shared/money.ts'
import { toMonthKey } from '../../shared/time.ts'
import { getPrice, type PriceTable } from '../pricing/pricing.ts'
import { calculateCost } from './cost.ts'
import type { UsageRecord } from './usage.ts'

export interface PricedUsageRecord extends UsageRecord {
  cost: number
}

export interface MonthlyUsage {
  month: string
  items: PricedUsageRecord[]
  totalCost: number
}

/** Records of one month in the configured time zone, newest first, each with its cost. */
export const listMonth = (
  records: UsageRecord[],
  month: string,
  timeZone: string,
  pricing: PriceTable,
): MonthlyUsage => {
  const items = records
    .filter((record) => toMonthKey(record.timestamp, timeZone) === month)
    .map((record) => ({ ...record, cost: calculateCost(record, getPrice(pricing, record.model)) }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const total = items.reduce((sum, item) => sum + item.cost, 0)
  return { month, items, totalCost: roundCents(total) }
}
