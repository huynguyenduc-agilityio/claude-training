import { describe, expect, it } from 'vitest'
import { budgetStatus } from './budget.ts'

describe('budgetStatus', () => {
  it('is ok below 80%', () => {
    expect(budgetStatus(10, 40).level).toBe('ok')
  })

  it('warns from 80%', () => {
    expect(budgetStatus(32, 40).level).toBe('warning')
  })

  it('is exceeded from 100%', () => {
    expect(budgetStatus(40, 40)).toEqual({ spent: 40, budget: 40, ratio: 1, level: 'exceeded' })
  })

  it('is ok when no budget is set', () => {
    expect(budgetStatus(12, 0)).toEqual({ spent: 12, budget: 0, ratio: 0, level: 'ok' })
  })
})
