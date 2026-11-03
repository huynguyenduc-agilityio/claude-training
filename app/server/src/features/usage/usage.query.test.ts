import { describe, expect, it } from 'vitest'
import { listMonth } from './usage.query.ts'
import type { UsageRecord } from './usage.ts'

const pricing = { 'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }] }

const make = (id: number, timestamp: string): UsageRecord => ({
  id,
  timestamp,
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 100_000,
  outputTokens: 20_000,
  cachedInputTokens: null,
})

describe('listMonth', () => {
  const records = [
    make(1, '2026-09-10T08:00:00.000Z'),
    make(2, '2026-09-20T08:00:00.000Z'),
    make(3, '2026-10-05T08:00:00.000Z'),
  ]

  it('keeps only records of the month, newest first', () => {
    const result = listMonth(records, '2026-09', 'Asia/Ho_Chi_Minh', pricing)

    expect(result.items.map((item) => item.id)).toEqual([2, 1])
  })

  it('prices each record and totals the month', () => {
    const result = listMonth(records, '2026-09', 'Asia/Ho_Chi_Minh', pricing)

    expect(result.items[0]?.cost).toBeCloseTo(0.2)
    expect(result.totalCost).toBe(0.4)
  })

  it('prices each record at the price of its timestamp (EXP-103)', () => {
    const dated = {
      'lyra-flash': [
        { inputPerMTok: 0.3, outputPerMTok: 2.5, cachedInputPerMTok: 0.03 },
        { from: '2026-10-01T00:00:00Z', inputPerMTok: 0.2, outputPerMTok: 2, cachedInputPerMTok: 0.03 },
      ],
    }
    // Both are October in Ho Chi Minh City; the first is still September in UTC
    const lyra = (id: number, timestamp: string): UsageRecord => ({
      ...make(id, timestamp),
      model: 'lyra-flash',
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    })
    const result = listMonth(
      [lyra(1, '2026-09-30T23:59:59.000Z'), lyra(2, '2026-10-01T00:00:00.000Z')],
      '2026-10',
      'Asia/Ho_Chi_Minh',
      dated,
    )

    expect(result.items.map((item) => item.cost)).toEqual([2.2, 2.8])
    expect(result.totalCost).toBe(5)
  })

  it('returns an empty month', () => {
    expect(listMonth(records, '2026-07', 'Asia/Ho_Chi_Minh', pricing)).toEqual({
      month: '2026-07',
      items: [],
      totalCost: 0,
    })
  })
})

describe('listMonth with a row that has no price (EXP-109)', () => {
  const priced = make(1, '2026-09-10T08:00:00.000Z')
  const unknown: UsageRecord = { ...make(2, '2026-09-20T08:00:00.000Z'), model: 'removed-model' }

  it('keeps both rows, newest first', () => {
    const result = listMonth([priced, unknown], '2026-09', 'Asia/Ho_Chi_Minh', pricing)

    expect(result.items.map((item) => item.id)).toEqual([2, 1])
  })

  it('flags the row with cost null and leaves it out of the total', () => {
    const result = listMonth([priced, unknown], '2026-09', 'Asia/Ho_Chi_Minh', pricing)

    expect(result.items[0]?.cost).toBeNull()
    expect(result.items[1]?.cost).toBeCloseTo(0.2)
    expect(result.totalCost).toBe(0.2)
  })

  it.each(['constructor', 'removed-model'])('does not throw for model %s', (model) => {
    const result = listMonth(
      [{ ...priced, model }],
      '2026-09',
      'Asia/Ho_Chi_Minh',
      pricing,
    )

    expect(result.items[0]?.cost).toBeNull()
    expect(result.totalCost).toBe(0)
  })

  it('does not throw for a timestamp before the first period', () => {
    const later = {
      'orion-mini': [
        { from: '2026-10-01T00:00:00Z', inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 },
      ],
    }

    const result = listMonth([priced], '2026-09', 'Asia/Ho_Chi_Minh', later)

    expect(result.items[0]?.cost).toBeNull()
    expect(result.totalCost).toBe(0)
  })
})
