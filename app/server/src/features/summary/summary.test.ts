import { describe, expect, it } from 'vitest'
import type { UsageRecord } from '../usage/usage.ts'
import { summarizeMonth } from './summary.ts'

const pricing = {
  'orion-large': { inputPerMTok: 5, outputPerMTok: 25, cachedInputPerMTok: 0.5 },
  'orion-mini': { inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 },
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
})
