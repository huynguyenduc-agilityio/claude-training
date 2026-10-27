import { describe, expect, it } from 'vitest'
import { currentMonthKey, isMonthKey, toMonthKey, toZonedIsoString } from './time.ts'

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

describe('toZonedIsoString', () => {
  it('writes the local time with its offset', () => {
    expect(toZonedIsoString('2026-09-30T18:00:00Z', 'Asia/Ho_Chi_Minh')).toBe(
      '2026-10-01T01:00:00+07:00',
    )
  })

  it('writes UTC as +00:00', () => {
    expect(toZonedIsoString('2026-09-30T18:00:00Z', 'UTC')).toBe('2026-09-30T18:00:00+00:00')
  })

  it('writes a half-hour offset', () => {
    expect(toZonedIsoString('2026-09-30T18:00:00Z', 'Asia/Kolkata')).toBe(
      '2026-09-30T23:30:00+05:30',
    )
  })

  it('writes a negative offset that follows daylight saving time', () => {
    expect(toZonedIsoString('2026-09-30T18:00:00Z', 'America/New_York')).toBe(
      '2026-09-30T14:00:00-04:00',
    )
    expect(toZonedIsoString('2026-01-15T12:00:00Z', 'America/New_York')).toBe(
      '2026-01-15T07:00:00-05:00',
    )
  })

  it('writes local midnight as hour 00', () => {
    expect(toZonedIsoString('2026-09-30T17:00:00Z', 'Asia/Ho_Chi_Minh')).toBe(
      '2026-10-01T00:00:00+07:00',
    )
  })
})

describe('currentMonthKey', () => {
  it('formats the given date', () => {
    expect(currentMonthKey('UTC', new Date('2026-10-20T00:00:00Z'))).toBe('2026-10')
  })
})
