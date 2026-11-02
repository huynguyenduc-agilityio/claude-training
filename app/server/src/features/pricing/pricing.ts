import { readFileSync } from 'node:fs'

/** USD per one million tokens. */
export interface ModelPrice {
  inputPerMTok: number
  outputPerMTok: number
  cachedInputPerMTok: number
}

/** A price that applies from `from` (ISO 8601 UTC) on; without `from`, since the start. */
export interface PricePeriod extends ModelPrice {
  from?: string
}

/** Price periods per model, oldest first. */
export type PriceTable = Record<string, PricePeriod[]>

const DEFAULT_PRICING_PATH = new URL('../../../data/pricing.json', import.meta.url)

const startOf = (period: PricePeriod): number =>
  period.from ? Date.parse(period.from) : Number.NEGATIVE_INFINITY

/** Reads the price table and sorts each model's periods oldest first, as `getPrice` expects. */
export const loadPricing = (path: string | URL = DEFAULT_PRICING_PATH): PriceTable => {
  const table = JSON.parse(readFileSync(path, 'utf8')) as PriceTable
  return Object.fromEntries(
    Object.entries(table).map(([model, periods]) => [
      model,
      periods.toSorted((a, b) => startOf(a) - startOf(b)),
    ]),
  )
}

/** Own keys only: names every object inherits, like `constructor`, are not models. */
export const isKnownModel = (table: PriceTable, model: string): boolean =>
  Object.hasOwn(table, model)

/** The price of `model` at `timestamp`: the last period that started at or before it. */
export const getPrice = (table: PriceTable, model: string, timestamp: string): ModelPrice => {
  const periods = isKnownModel(table, model) ? table[model] : undefined
  if (!periods) throw new Error(`Unknown model: ${model}`)
  const at = Date.parse(timestamp)
  const price = periods.findLast((period) => !period.from || Date.parse(period.from) <= at)
  if (!price) throw new Error(`No price for ${model} at ${timestamp}`)
  return price
}
