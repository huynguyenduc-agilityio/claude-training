import { describe, expect, it } from 'vitest'
import { listMonth } from './usage.query.ts'
import type { UsageRecord } from './usage.ts'

const pricing = { 'orion-mini': { inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 } }

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

  it('returns an empty month', () => {
    expect(listMonth(records, '2026-07', 'Asia/Ho_Chi_Minh', pricing)).toEqual({
      month: '2026-07',
      items: [],
      totalCost: 0,
    })
  })
})
