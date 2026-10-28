import { describe, expect, it } from 'vitest'
import { parseNewUsageRecord } from './usage.validation.ts'

const pricing = { 'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }] }

const valid = {
  timestamp: '2026-10-02T09:30:00Z',
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 1200,
  outputTokens: 300,
}

describe('parseNewUsageRecord', () => {
  it('returns a normalized record', () => {
    expect(parseNewUsageRecord(valid, pricing)).toEqual({
      ...valid,
      timestamp: '2026-10-02T09:30:00.000Z',
      cachedInputTokens: null,
    })
  })

  it('rejects an unknown model', () => {
    expect(() => parseNewUsageRecord({ ...valid, model: 'gpt-x' }, pricing)).toThrow(
      'Unknown model: gpt-x',
    )
  })

  it('rejects a missing project', () => {
    expect(() => parseNewUsageRecord({ ...valid, project: ' ' }, pricing)).toThrow(
      'project is required',
    )
  })

  it('rejects a non-integer token count', () => {
    expect(() => parseNewUsageRecord({ ...valid, inputTokens: '12' }, pricing)).toThrow(
      'inputTokens must be an integer',
    )
  })

  it.each(['inputTokens', 'outputTokens', 'cachedInputTokens'])(
    'rejects a negative %s (EXP-105)',
    (field) => {
      expect(() => parseNewUsageRecord({ ...valid, [field]: -1 }, pricing)).toThrow(
        `${field} must not be negative`,
      )
    },
  )

  it('accepts zero token counts (EXP-105)', () => {
    const zero = { ...valid, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 }
    expect(parseNewUsageRecord(zero, pricing)).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
    })
  })

  it('rejects cachedInputTokens above inputTokens (EXP-108)', () => {
    const record = { ...valid, cachedInputTokens: valid.inputTokens + 1 }
    expect(() => parseNewUsageRecord(record, pricing)).toThrow(
      'cachedInputTokens must not exceed inputTokens',
    )
  })

  it('accepts cachedInputTokens equal to inputTokens (EXP-108)', () => {
    const record = { ...valid, cachedInputTokens: valid.inputTokens }
    expect(parseNewUsageRecord(record, pricing)).toMatchObject({
      inputTokens: 1200,
      cachedInputTokens: 1200,
    })
  })

  it('accepts a null cachedInputTokens (EXP-108)', () => {
    expect(parseNewUsageRecord({ ...valid, cachedInputTokens: null }, pricing)).toMatchObject({
      cachedInputTokens: null,
    })
  })

  it('rejects an invalid timestamp', () => {
    expect(() => parseNewUsageRecord({ ...valid, timestamp: 'yesterday' }, pricing)).toThrow(
      'timestamp must be an ISO 8601 date',
    )
  })
})
