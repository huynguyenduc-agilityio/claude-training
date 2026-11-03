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

const PRICE_FIELDS = ['inputPerMTok', 'outputPerMTok', 'cachedInputPerMTok'] as const

const ISO_UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Throws at the first problem, naming the model and the period (counted from 1). */
const assertValidPriceTable: (table: unknown) => asserts table is PriceTable = (table) => {
  const fail = (where: string, reason: string): never => {
    throw new Error(`Invalid price table: ${where ? `${where}: ` : ''}${reason}`)
  }
  if (!isObject(table)) return fail('', 'must be an object')
  for (const [model, periods] of Object.entries(table)) {
    if (!Array.isArray(periods) || periods.length === 0) {
      return fail(model, 'must be a non-empty list of periods')
    }
    periods.forEach((period: unknown, index) => {
      const where = `${model} period ${index + 1}`
      if (!isObject(period)) return fail(where, 'must be an object')
      for (const field of PRICE_FIELDS) {
        const price = period[field]
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
          fail(where, `${field} must be a finite number that is not negative`)
        }
      }
      const { from } = period
      if (
        from !== undefined &&
        (typeof from !== 'string' || !ISO_UTC_INSTANT.test(from) || Number.isNaN(Date.parse(from)))
      ) {
        fail(where, 'from must be an ISO 8601 UTC instant, such as 2026-10-01T00:00:00Z')
      }
    })
  }
}

/** Reads the price table and sorts each model's periods oldest first, as `findPrice` expects. */
export const loadPricing = (path: string | URL = DEFAULT_PRICING_PATH): PriceTable => {
  const table: unknown = JSON.parse(readFileSync(path, 'utf8'))
  assertValidPriceTable(table)
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

/** The price of `model` at `timestamp`: the last period that started at or before it, if any. */
export const findPrice = (
  table: PriceTable,
  model: string,
  timestamp: string,
): ModelPrice | undefined => {
  const periods = isKnownModel(table, model) ? table[model] : undefined
  const at = Date.parse(timestamp)
  return periods?.findLast((period) => !period.from || Date.parse(period.from) <= at)
}

/** Like `findPrice`, for callers that treat a missing price as an error. */
export const getPrice = (table: PriceTable, model: string, timestamp: string): ModelPrice => {
  if (!isKnownModel(table, model)) throw new Error(`Unknown model: ${model}`)
  const price = findPrice(table, model, timestamp)
  if (!price) throw new Error(`No price for ${model} at ${timestamp}`)
  return price
}
