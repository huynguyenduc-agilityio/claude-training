import { findPrice, type ModelPrice, type PriceTable } from '../pricing/pricing.ts'
import type { NewUsageRecord } from './usage.ts'

const PER_MILLION = 1_000_000

type CostInput = Pick<NewUsageRecord, 'inputTokens' | 'outputTokens' | 'cachedInputTokens'>

/** Cost in USD. Cached input tokens are billed at the cached rate, the rest at the input rate. */
export const calculateCost = (record: CostInput, price: ModelPrice): number => {
  const cached = record.cachedInputTokens ?? 0
  const uncached = record.inputTokens - cached
  return (
    (uncached * price.inputPerMTok +
      cached * price.cachedInputPerMTok +
      record.outputTokens * price.outputPerMTok) /
    PER_MILLION
  )
}

/** The record's cost, or null when the price table has no price for it. */
export const costOf = (record: NewUsageRecord, pricing: PriceTable): number | null => {
  const price = findPrice(pricing, record.model, record.timestamp)
  return price ? calculateCost(record, price) : null
}
