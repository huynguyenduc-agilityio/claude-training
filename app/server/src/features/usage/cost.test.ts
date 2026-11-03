import { describe, expect, it } from 'vitest'
import { calculateCost } from './cost.ts'
import { costOf } from './cost.ts'
import type { NewUsageRecord } from './usage.ts'

const price = { inputPerMTok: 5, outputPerMTok: 25, cachedInputPerMTok: 0.5 }

describe('calculateCost', () => {
  it('bills input and output tokens per million', () => {
    const cost = calculateCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000, cachedInputTokens: 0 },
      price,
    )

    expect(cost).toBe(30)
  })

  it('bills cached input tokens at the cached rate', () => {
    const cost = calculateCost(
      { inputTokens: 1_000_000, outputTokens: 0, cachedInputTokens: 400_000 },
      price,
    )

    expect(cost).toBeCloseTo(600_000 * 5e-6 + 400_000 * 0.5e-6)
  })

  it('bills only the cached rate when all input tokens are cached (EXP-108)', () => {
    const cost = calculateCost(
      { inputTokens: 1_000_000, outputTokens: 0, cachedInputTokens: 1_000_000 },
      price,
    )

    expect(cost).toBe(0.5)
  })

  it('treats a missing cached count as no cache use', () => {
    const cost = calculateCost(
      { inputTokens: 2_000, outputTokens: 1_000, cachedInputTokens: null },
      price,
    )

    expect(cost).toBeCloseTo(0.01 + 0.025)
  })
})

describe('costOf (EXP-109)', () => {
  const pricing = { 'orion-large': [price] }
  const record: NewUsageRecord = {
    timestamp: '2026-10-15T12:00:00.000Z',
    model: 'orion-large',
    project: 'support-bot',
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    cachedInputTokens: 400_000,
  }

  it('returns the cost of a record that has a price', () => {
    expect(costOf(record, pricing)).toBe(calculateCost(record, price))
  })

  it('returns null for an unknown model', () => {
    expect(costOf({ ...record, model: 'removed-model' }, pricing)).toBeNull()
  })

  it('returns null for a name inherited from Object.prototype', () => {
    expect(costOf({ ...record, model: 'constructor' }, pricing)).toBeNull()
  })

  it('returns null for a timestamp before the first period', () => {
    const later = { 'orion-large': [{ from: '2026-11-01T00:00:00Z', ...price }] }

    expect(costOf(record, later)).toBeNull()
  })
})
