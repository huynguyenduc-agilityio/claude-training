import { describe, expect, it } from 'vitest'
import { calculateCost } from './cost.ts'

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

  it('treats a missing cached count as no cache use', () => {
    const cost = calculateCost(
      { inputTokens: 2_000, outputTokens: 1_000, cachedInputTokens: null },
      price,
    )

    expect(cost).toBeCloseTo(0.01 + 0.025)
  })
})
