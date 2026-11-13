import { describe, expect, it } from 'vitest'
import { budgetEntry } from '../../test/fakeApi.ts'
import { bannerProjects } from './projectBudgetOrder.ts'

const names = (list: ReturnType<typeof bannerProjects>) => list.map((entry) => entry.project)

describe('bannerProjects', () => {
  it('keeps only warning and exceeded projects (B-03)', () => {
    const result = bannerProjects([
      budgetEntry('support-bot', 10, 5, 50, 'ok'),
      budgetEntry('docs-search', null, 1.2, null, 'none'),
      budgetEntry('code-review', 10, 8.12, 81, 'warning'),
    ])
    expect(names(result)).toEqual(['code-review'])
  })

  it('puts exceeded before warning, then the higher share first (B-04)', () => {
    const result = bannerProjects([
      budgetEntry('a', 10, 8.5, 85, 'warning'),
      budgetEntry('b', 10, 13, 130, 'exceeded'),
      budgetEntry('c', 10, 11, 110, 'exceeded'),
    ])
    expect(names(result)).toEqual(['b', 'c', 'a'])
  })

  it('puts an exceeded project before a warning one even with a lower share', () => {
    const result = bannerProjects([
      budgetEntry('w', 1000, 999.99, 99, 'warning'),
      budgetEntry('e', 10, 10, 100, 'exceeded'),
    ])
    expect(names(result)).toEqual(['e', 'w'])
  })

  it('orders equal shares by name in code-point order (B-05)', () => {
    const result = bannerProjects([
      budgetEntry('a', 20, 18, 90, 'warning'),
      budgetEntry('B', 10, 9, 90, 'warning'),
      budgetEntry('b', 30, 27, 90, 'warning'),
    ])
    expect(names(result)).toEqual(['B', 'a', 'b'])
  })

  it('compares shares in whole cents, not by the shown percent', () => {
    // 85.5% and 85.4% both show 85%; the exact shares decide.
    const result = bannerProjects([
      budgetEntry('low', 1000, 854, 85, 'warning'),
      budgetEntry('high', 1000, 855, 85, 'warning'),
    ])
    expect(names(result)).toEqual(['high', 'low'])
  })

  it('does not lose to float error: 2.4 of 3 equals 8 of 10', () => {
    const result = bannerProjects([
      budgetEntry('z', 10, 8, 80, 'warning'),
      budgetEntry('y', 3, 2.4, 80, 'warning'),
    ])
    expect(names(result)).toEqual(['y', 'z'])
  })

  it('orders astral characters after the end of the basic plane (code points, not UTF-16)', () => {
    const result = bannerProjects([
      budgetEntry('\u{1F600}', 10, 9, 90, 'warning'),
      budgetEntry('Ａ', 10, 9, 90, 'warning'),
    ])
    expect(names(result)).toEqual(['Ａ', '\u{1F600}'])
  })

  it('returns an empty list when nothing is near or over its budget', () => {
    expect(bannerProjects([])).toEqual([])
  })
})
