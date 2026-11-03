import { roundCents } from '../../shared/money.ts'
import { toMonthKey } from '../../shared/time.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import { costOf } from './cost.ts'
import type { UsageRecord } from './usage.ts'

export interface PricedUsageRecord extends UsageRecord {
  cost: number
}

/** A record the price table cannot price, e.g. its model was removed from `pricing.json`. */
export interface UnpricedUsageRecord extends UsageRecord {
  cost: null
}

export interface MonthlyUsage {
  month: string
  items: (PricedUsageRecord | UnpricedUsageRecord)[]
  totalCost: number
}

const priceItem = (
  record: UsageRecord,
  pricing: PriceTable,
): PricedUsageRecord | UnpricedUsageRecord => {
  const cost = costOf(record, pricing)
  return cost === null ? { ...record, cost } : { ...record, cost }
}

/** Records whose timestamp falls in the `YYYY-MM` month as seen from `timeZone`. */
export const recordsInMonth = (
  records: UsageRecord[],
  month: string,
  timeZone: string,
): UsageRecord[] => records.filter((record) => toMonthKey(record.timestamp, timeZone) === month)

/** Records of one month in the configured time zone, newest first, each with its cost. */
export const listMonth = (
  records: UsageRecord[],
  month: string,
  timeZone: string,
  pricing: PriceTable,
): MonthlyUsage => {
  const items = recordsInMonth(records, month, timeZone)
    .map((record) => priceItem(record, pricing))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const total = items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  return { month, items, totalCost: roundCents(total) }
}
