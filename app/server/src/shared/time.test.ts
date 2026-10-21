import { describe, expect, it } from 'vitest'
import { currentMonthKey, isMonthKey, toMonthKey } from './time.ts'

describe('isMonthKey', () => {
  it('accepts YYYY-MM', () => {
    expect(isMonthKey('2026-09')).toBe(true)
  })

  it('rejects other shapes', () => {
    expect(isMonthKey('2026-9')).toBe(false)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('September')).toBe(false)
  })
})

describe('toMonthKey', () => {
  it('returns the month of a mid-month timestamp', () => {
    expect(toMonthKey('2026-09-15T08:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('2026-09')
  })

  it('uses the given time zone near midnight', () => {
    expect(toMonthKey('2026-09-30T20:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('2026-10')
    expect(toMonthKey('2026-09-30T20:00:00Z', 'UTC')).toBe('2026-09')
  })
})

describe('currentMonthKey', () => {
  it('formats the given date', () => {
    expect(currentMonthKey('UTC', new Date('2026-10-20T00:00:00Z'))).toBe('2026-10')
  })
})
