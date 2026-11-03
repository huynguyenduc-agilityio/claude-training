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

  const loadFrom = (content: unknown) => {
    const path = join(mkdtempSync(join(tmpdir(), 'pricing-')), 'pricing.json')
    writeFileSync(path, JSON.stringify(content))
    return loadPricing(path)
  }

  describe('rejects an invalid price table (EXP-110)', () => {
    it.each([
      ['an array', []],
      ['null', null],
    ])('throws when the top level is %s', (_label, content) => {
      expect(() => loadFrom(content)).toThrow('Invalid price table: must be an object')
    })

    it.each([
      ['an object', {}],
      ['a string', 'oops'],
      ['a number', 3],
      ['null', null],
    ])("throws when a model's value is %s", (_label, value) => {
      expect(() => loadFrom({ 'lyra-flash': value })).toThrow(
        'Invalid price table: lyra-flash: must be a non-empty list of periods',
      )
    })

    it('throws for a model with an empty list of periods', () => {
      expect(() => loadFrom({ 'lyra-flash': [] })).toThrow(
        'Invalid price table: lyra-flash: must be a non-empty list of periods',
      )
    })

    it.each([
      ['a string', 'oops'],
      ['null', null],
      ['an array', []],
      ['a number', 3],
    ])('throws when a period is %s, and names the period number', (_label, period) => {
      expect(() => loadFrom({ 'lyra-flash': [oldPrice, period] })).toThrow(
        'Invalid price table: lyra-flash period 2: must be an object',
      )
    })

    const badPrices: [string, unknown][] = [
      ['missing', undefined],
      ['a string', '1'],
      ['null', null],
      ['negative', -0.5],
    ]

    describe.each(['inputPerMTok', 'outputPerMTok', 'cachedInputPerMTok'])('%s', (field) => {
      it.each(badPrices)('throws when it is %s', (_label, value) => {
        expect(() =>
          loadFrom({
            'orion-mini': [{ ...oldPrice }, { from: '2026-10-01T00:00:00Z', ...newPrice, [field]: value }],
          }),
        ).toThrow(
          `Invalid price table: orion-mini period 2: ${field} must be a finite number that is not negative`,
        )
      })
    })

    it.each([
      ['unparseable', 'not-a-date'],
      ['a date in words', 'Oct 1 2026'],
      ['without a Z', '2026-10-01T00:00:00'],
      ['a date only', '2026-10-01'],
      ['a number', 1790812800000],
    ])('throws when from is %s', (_label, from) => {
      expect(() => loadFrom({ 'lyra-flash': [{ from, ...newPrice }] })).toThrow(
        'Invalid price table: lyra-flash period 1: from must be an ISO 8601 UTC instant, such as 2026-10-01T00:00:00Z',
      )
    })

    it('stops at the first problem, in file order', () => {
      expect(() =>
        loadFrom({
          'lyra-flash': [{ ...oldPrice, inputPerMTok: -1 }],
          'orion-mini': [],
        }),
      ).toThrow('Invalid price table: lyra-flash period 1: inputPerMTok')
    })
  })

  describe('accepts a valid price table (EXP-110)', () => {
    it('loads a price of 0', () => {
      const free = { inputPerMTok: 0, outputPerMTok: 0, cachedInputPerMTok: 0 }

      expect(getPrice(loadFrom({ 'free-model': [free] }), 'free-model', '2026-10-15T12:00:00.000Z'))
        .toMatchObject(free)
    })

    it('loads a period without from', () => {
      expect(() => loadFrom({ 'orion-mini': [oldPrice] })).not.toThrow()
    })

    it('loads a model whose periods all have from', () => {
      const pricing = loadFrom({
        'lyra-flash': [
          { from: '2026-01-01T00:00:00Z', ...oldPrice },
          { from: '2026-10-01T00:00:00.500Z', ...newPrice },
        ],
      })

      expect(getPrice(pricing, 'lyra-flash', '2026-09-30T23:59:59.000Z')).toMatchObject(oldPrice)
      expect(getPrice(pricing, 'lyra-flash', '2026-10-01T00:00:01.000Z')).toMatchObject(newPrice)
    })

    it('ignores extra fields', () => {
      expect(() =>
        loadFrom({ 'orion-mini': [{ ...oldPrice, note: 'promo', currency: 'USD' }] }),
      ).not.toThrow()
    })

    it('loads the real pricing.json', () => {
      expect(() => loadPricing()).not.toThrow()
    })
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
