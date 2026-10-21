import { readFileSync } from 'node:fs'

/** USD per one million tokens. */
export interface ModelPrice {
  inputPerMTok: number
  outputPerMTok: number
  cachedInputPerMTok: number
}

export type PriceTable = Record<string, ModelPrice>

const DEFAULT_PRICING_PATH = new URL('../../../data/pricing.json', import.meta.url)

export const loadPricing = (path: string | URL = DEFAULT_PRICING_PATH): PriceTable =>
  JSON.parse(readFileSync(path, 'utf8')) as PriceTable

export const getPrice = (table: PriceTable, model: string): ModelPrice => {
  const price = table[model]
  if (!price) throw new Error(`Unknown model: ${model}`)
  return price
}
