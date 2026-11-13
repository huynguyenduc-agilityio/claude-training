import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../shared/db.ts'
import { createProjectBudgetRepository } from './project-budget.repository.ts'

const make = () => createProjectBudgetRepository(openDatabase(':memory:'))

describe('project budget repository', () => {
  it('starts empty', () => {
    expect(make().list().size).toBe(0)
  })

  it('stores a budget and lists it in dollars', () => {
    const budgets = make()

    budgets.set('code-review', 12.5)

    expect(budgets.list().get('code-review')).toBe(12.5)
  })

  it('replaces the budget of a project', () => {
    const budgets = make()

    budgets.set('code-review', 10)
    budgets.set('code-review', 20)

    expect([...budgets.list()]).toEqual([['code-review', 20]])
  })

  it('removes a budget, also when none is set', () => {
    const budgets = make()
    budgets.set('code-review', 10)

    budgets.remove('code-review')
    budgets.remove('docs-search')

    expect(budgets.list().size).toBe(0)
  })

  it('keeps names that differ only in case apart', () => {
    const budgets = make()

    budgets.set('b', 1)
    budgets.set('B', 2)

    expect(budgets.list().get('b')).toBe(1)
    expect(budgets.list().get('B')).toBe(2)
  })

  it('stores whole cents, so 131072.02 comes back unchanged', () => {
    const budgets = make()

    budgets.set('big', 131072.02)

    expect(budgets.list().get('big')).toBe(131072.02)
  })

  it('clears every budget', () => {
    const budgets = make()
    budgets.set('a', 1)
    budgets.set('b', 2)

    budgets.clear()

    expect(budgets.list().size).toBe(0)
  })
})
