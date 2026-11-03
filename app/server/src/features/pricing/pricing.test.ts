import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPrice, loadPricing } from './pricing.ts'
import { findPrice } from './pricing.ts'

const oldPrice = { inputPerMTok: 0.3, outputPerMTok: 2.5, cachedInputPerMTok: 0.03 }
const newPrice = { inputPerMTok: 0.2, outputPerMTok: 2, cachedInputPerMTok: 0.03 }

const table = {
  'lyra-flash': [oldPrice, { from: '2026-10-01T00:00:00Z', ...newPrice }],
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

describe('getPrice', () => {
  it('uses the old price before the change (EXP-103)', () => {
    expect(getPrice(table, 'lyra-flash', '2026-09-30T23:59:59.000Z')).toMatchObject(oldPrice)
  })

  it('uses the new price from the instant of the change (EXP-103)', () => {
    expect(getPrice(table, 'lyra-flash', '2026-10-01T00:00:00.000Z')).toMatchObject(newPrice)
    expect(getPrice(table, 'lyra-flash', '2026-10-15T12:00:00.000Z')).toMatchObject(newPrice)
  })

  it('uses the only period of a model without price changes (EXP-103)', () => {
    expect(getPrice(table, 'orion-mini', '2026-10-15T12:00:00.000Z')).toMatchObject({
      inputPerMTok: 1,
      outputPerMTok: 5,
      cachedInputPerMTok: 0.1,
    })
  })

  it('throws for an unknown model', () => {
    expect(() => getPrice(table, 'gpt-x', '2026-10-15T12:00:00.000Z')).toThrow(
      'Unknown model: gpt-x',
    )
  })

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    'throws for %s, inherited from Object.prototype (EXP-107)',
    (model) => {
      expect(() => getPrice(table, model, '2026-10-15T12:00:00.000Z')).toThrow(
        `Unknown model: ${model}`,
      )
    },
  )
})

describe('loadPricing', () => {
  it('sorts periods by start, so a misordered file still picks the right price (EXP-103)', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'pricing-')), 'pricing.json')
    writeFileSync(path, JSON.stringify({ 'lyra-flash': table['lyra-flash'].toReversed() }))
    const pricing = loadPricing(path)

    expect(getPrice(pricing, 'lyra-flash', '2026-09-30T23:59:59.000Z')).toMatchObject(oldPrice)
    expect(getPrice(pricing, 'lyra-flash', '2026-10-01T00:00:00.000Z')).toMatchObject(newPrice)
  })
})

describe('pricing.json', () => {
  const pricing = loadPricing()

  it('prices lyra-flash at the new price from 2026-10-01 UTC (EXP-103)', () => {
    expect(getPrice(pricing, 'lyra-flash', '2026-09-30T23:59:59.000Z')).toMatchObject(oldPrice)
    expect(getPrice(pricing, 'lyra-flash', '2026-10-01T00:00:00.000Z')).toMatchObject(newPrice)
  })

  it('keeps the other models unchanged (EXP-103)', () => {
    for (const timestamp of ['2026-09-15T00:00:00.000Z', '2026-10-15T00:00:00.000Z']) {
      expect(getPrice(pricing, 'orion-large', timestamp)).toMatchObject({
        inputPerMTok: 5,
        outputPerMTok: 25,
        cachedInputPerMTok: 0.5,
      })
      expect(getPrice(pricing, 'orion-mini', timestamp)).toMatchObject({
        inputPerMTok: 1,
        outputPerMTok: 5,
        cachedInputPerMTok: 0.1,
      })
    }
  })
})

describe('findPrice (EXP-109)', () => {
  it('returns the price of a known model', () => {
    expect(findPrice(table, 'orion-mini', '2026-10-15T12:00:00.000Z')).toMatchObject({
      inputPerMTok: 1,
      outputPerMTok: 5,
      cachedInputPerMTok: 0.1,
    })
  })

  it('returns undefined for an unknown model', () => {
    expect(findPrice(table, 'gpt-x', '2026-10-15T12:00:00.000Z')).toBeUndefined()
  })

  it('returns undefined for a name inherited from Object.prototype', () => {
    expect(findPrice(table, 'constructor', '2026-10-15T12:00:00.000Z')).toBeUndefined()
  })

  it('returns undefined for a timestamp before the first period', () => {
    const later = { 'starts-later': [{ from: '2026-10-01T00:00:00Z', ...newPrice }] }

    expect(findPrice(later, 'starts-later', '2026-09-30T23:59:59.000Z')).toBeUndefined()
  })
})
