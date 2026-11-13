import { describe, expect, it } from 'vitest'
import { ApiError } from '../../shared/api.ts'
import { failureMessage, toBudgetAmount } from './budgetForm.ts'

describe('toBudgetAmount', () => {
  it('sends an empty or blank field as null, never 0', () => {
    expect(toBudgetAmount('')).toBeNull()
    expect(toBudgetAmount('   ')).toBeNull()
  })

  it('sends what was typed and leaves the rules to the API', () => {
    expect(toBudgetAmount('15')).toBe(15)
    expect(toBudgetAmount('7.5')).toBe(7.5)
    expect(toBudgetAmount('0')).toBe(0)
    expect(toBudgetAmount('-5')).toBe(-5)
    expect(toBudgetAmount('10.005')).toBe(10.005)
  })
})

describe('failureMessage', () => {
  it('shows the API text alone for a 4xx answer', () => {
    const error = new ApiError('budgetUsd must be greater than 0', 400)
    expect(failureMessage(error, 'save')).toBe('budgetUsd must be greater than 0')
    expect(failureMessage(new ApiError('project not found', 404), 'remove')).toBe('project not found')
  })

  it('shows the fallback text alone for a 4xx answer without an error field', () => {
    expect(failureMessage(new ApiError('Request failed: 404', 404), 'save')).toBe(
      'Request failed: 404',
    )
  })

  it('adds the prefix for a 5xx answer', () => {
    const error = new ApiError('Internal server error', 500)
    expect(failureMessage(error, 'save')).toBe('Could not save: Internal server error')
    expect(failureMessage(error, 'remove')).toBe('Could not remove: Internal server error')
  })

  it('adds the prefix when there is no response', () => {
    expect(failureMessage(new TypeError('Failed to fetch'), 'save')).toBe(
      'Could not save: Failed to fetch',
    )
    expect(failureMessage(new TypeError('Failed to fetch'), 'remove')).toBe(
      'Could not remove: Failed to fetch',
    )
  })
})
