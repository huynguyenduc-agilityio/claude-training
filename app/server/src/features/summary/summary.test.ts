import { describe, expect, it } from 'vitest'
import type { UsageRecord } from '../usage/usage.ts'
import { summarizeMonth } from './summary.ts'

const pricing = {
  'orion-large': [{ inputPerMTok: 5, outputPerMTok: 25, cachedInputPerMTok: 0.5 }],
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

const make = (id: number, overrides: Partial<UsageRecord>): UsageRecord => ({
  id,
  timestamp: '2026-09-12T04:00:00.000Z',
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 100_000,
  outputTokens: 20_000,
  cachedInputTokens: null,
  ...overrides,
})

describe('summarizeMonth', () => {
  const records = [
    make(1, {}),
    make(2, { model: 'orion-large', project: 'code-review' }),
    make(3, { project: 'code-review' }),
    make(4, { timestamp: '2026-08-14T04:00:00.000Z' }),
  ]

  it('totals the month', () => {
    const summary = summarizeMonth(records, '2026-09', 'UTC', pricing)

    expect(summary.recordCount).toBe(3)
    expect(summary.totalCost).toBe(1.4)
  })

  it('breaks the month down by model, most expensive first', () => {
    const summary = summarizeMonth(records, '2026-09', 'UTC', pricing)

    expect(summary.byModel).toEqual([
      { key: 'orion-large', cost: 1, records: 1 },
      { key: 'orion-mini', cost: 0.4, records: 2 },
    ])
  })

  it('breaks the month down by project', () => {
    const summary = summarizeMonth(records, '2026-09', 'UTC', pricing)

    expect(summary.byProject).toEqual([
      { key: 'code-review', cost: 1.2, records: 2 },
      { key: 'support-bot', cost: 0.2, records: 1 },
    ])
  })

  it('returns zeros for a month without records', () => {
    expect(summarizeMonth(records, '2026-07', 'UTC', pricing)).toEqual({
      month: '2026-07',
      totalCost: 0,
      recordCount: 0,
      byModel: [],
      byProject: [],
    })
  })

  it('prices each record at the price of its timestamp (EXP-103)', () => {
    const dated = {
      'lyra-flash': [
        { inputPerMTok: 0.3, outputPerMTok: 2.5, cachedInputPerMTok: 0.03 },
        { from: '2026-10-01T00:00:00Z', inputPerMTok: 0.2, outputPerMTok: 2, cachedInputPerMTok: 0.03 },
      ],
    }
    const lyra = { model: 'lyra-flash', inputTokens: 1_000_000, outputTokens: 1_000_000 }
    // Both are October in Ho Chi Minh City; the first is still before the change in UTC
    const records = [
      make(6, { ...lyra, timestamp: '2026-09-30T23:59:59.000Z' }),
      make(7, { ...lyra, timestamp: '2026-10-01T00:00:00.000Z' }),
    ]

    const summary = summarizeMonth(records, '2026-10', 'Asia/Ho_Chi_Minh', dated)

    expect(summary.totalCost).toBe(5)
    expect(summary.byModel).toEqual([{ key: 'lyra-flash', cost: 5, records: 2 }])
  })

  it('picks the month in the given time zone', () => {
    // 2026-09-30 20:00 UTC is 2026-10-01 03:00 in Ho Chi Minh City (UTC+7)
    const lateNight = [make(5, { timestamp: '2026-09-30T20:00:00.000Z' })]

    expect(summarizeMonth(lateNight, '2026-10', 'Asia/Ho_Chi_Minh', pricing).recordCount).toBe(1)
    expect(summarizeMonth(lateNight, '2026-09', 'Asia/Ho_Chi_Minh', pricing).recordCount).toBe(0)
    expect(summarizeMonth(lateNight, '2026-09', 'UTC', pricing).recordCount).toBe(1)
  })
})

describe('summarizeMonth with a row that has no price (EXP-109)', () => {
  const records = [
    make(1, {}),
    make(2, { model: 'removed-model', project: 'code-review' }),
  ]

  it('counts the row but leaves it out of the money and the breakdowns', () => {
    const summary = summarizeMonth(records, '2026-09', 'UTC', pricing)

    expect(summary.recordCount).toBe(2)
    expect(summary.totalCost).toBe(0.2)
    expect(summary.byModel).toEqual([{ key: 'orion-mini', cost: 0.2, records: 1 }])
    expect(summary.byProject).toEqual([{ key: 'support-bot', cost: 0.2, records: 1 }])
    expect(summary.unpricedCount).toBe(1)
  })

  it('has no unpricedCount for a month without such a row', () => {
    const summary = summarizeMonth([make(1, {})], '2026-09', 'UTC', pricing)

    expect(summary.unpricedCount).toBeUndefined()
  })
})
