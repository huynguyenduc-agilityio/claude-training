import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../shared/errors.ts'
import { parseBudgetUsd } from './project-budget.validation.ts'

const NUMBER = 'budgetUsd must be a number'
const POSITIVE = 'budgetUsd must be greater than 0'
const MAXIMUM = 'budgetUsd must be at most 1000000'
const DECIMALS = 'budgetUsd must have at most 2 decimals'

const errorOf = (body: unknown): string | undefined => {
  try {
    parseBudgetUsd(body)
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError)
    return (error as Error).message
  }
  return undefined
}

describe('parseBudgetUsd (EXP-112 scenario 8, A-15 to A-22, A-30)', () => {
  it.each([12.5, 20, 0.01, 1_000_000, 131072.02, 999999.99, 500000.01, 0.07, 1.15])(
    'accepts %s',
    (budgetUsd) => {
      expect(parseBudgetUsd({ budgetUsd })).toBe(budgetUsd)
    },
  )

  it('accepts every 2-decimal amount from 0.01 to 1000000.00 (float error above $131 072)', () => {
    for (let cents = 1; cents <= 100_000_000; cents += 1) {
      const budgetUsd = cents / 100
      if (errorOf({ budgetUsd }) !== undefined) {
        throw new Error(`${budgetUsd} was rejected`)
      }
    }
  }, 60_000)

  it('rounds an accepted amount to cents (A-30)', () => {
    expect(parseBudgetUsd({ budgetUsd: 10.000000000001 })).toBe(10)
  })

  it.each([0, -5, 1e-12, -5.005, -0.004])('rejects %s as not greater than 0', (budgetUsd) => {
    expect(errorOf({ budgetUsd })).toBe(POSITIVE)
  })

  it.each([10.005, 0.005, 999999.995, 0.1234])('rejects %s as more than 2 decimals', (budgetUsd) => {
    expect(errorOf({ budgetUsd })).toBe(DECIMALS)
  })

  it('rejects 1000000.01 as above the maximum', () => {
    expect(errorOf({ budgetUsd: 1_000_000.01 })).toBe(MAXIMUM)
  })

  it('checks the maximum before the decimals', () => {
    expect(errorOf({ budgetUsd: 1_000_000.005 })).toBe(MAXIMUM)
  })

  it.each([
    ['a string', { budgetUsd: '10' }],
    ['null', { budgetUsd: null }],
    ['a boolean', { budgetUsd: true }],
    ['an array', { budgetUsd: [1] }],
    ['an object', { budgetUsd: {} }],
    ['Infinity (1e999)', { budgetUsd: Infinity }],
    ['NaN', { budgetUsd: Number.NaN }],
    ['a missing field', {}],
    ['an unrelated field', { amount: 5 }],
    ['an empty array body', []],
    ['no body', undefined],
    ['a null body', null],
    ['a string body', 'x'],
  ])('rejects %s as not a number', (_name, body) => {
    expect(errorOf(body)).toBe(NUMBER)
  })

  it('ignores fields other than budgetUsd (A-22)', () => {
    expect(parseBudgetUsd({ budgetUsd: 5, extra: 1 })).toBe(5)
  })
})
