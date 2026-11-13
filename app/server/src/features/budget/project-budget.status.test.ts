import { describe, expect, it } from 'vitest'
import { listProjectBudgets, projectBudgetEntry } from './project-budget.status.ts'

const pricing = {
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

// 1 million input tokens cost exactly $1 with orion-mini, so 10 000 tokens cost 1 cent
const record = (project: string, cents: number, timestamp: string, model = 'orion-mini') => ({
  id: 1,
  timestamp,
  model,
  project,
  inputTokens: cents * 10_000,
  outputTokens: 0,
  cachedInputTokens: null,
})

const IN_MONTH = '2026-10-15T04:00:00.000Z'
const OTHER_MONTH = '2026-08-15T04:00:00.000Z'

describe('projectBudgetEntry (EXP-112 scenario 2 and 3, A-06 to A-09)', () => {
  it('has no budget, ratio, percent and level "none" for a project without budget', () => {
    expect(projectBudgetEntry('docs-search', 1.2, null)).toEqual({
      project: 'docs-search',
      budget: null,
      spent: 1.2,
      ratio: null,
      percent: null,
      level: 'none',
    })
  })

  it.each([
    [0, 0, 'ok'],
    [7.99, 79, 'ok'],
    [8, 80, 'warning'],
    [9.99, 99, 'warning'],
    [10, 100, 'exceeded'],
    [12.5, 125, 'exceeded'],
  ])('budget 10.00 with %s spent gives percent %s and level %s', (spent, percent, level) => {
    const entry = projectBudgetEntry('code-review', spent, 10)

    expect(entry.percent).toBe(percent)
    expect(entry.level).toBe(level)
    expect(entry.ratio).toBe(spent / 10)
  })

  it('computes in whole cents: 2.40 of 3.00 is 80 and warning', () => {
    const entry = projectBudgetEntry('p', 2.4, 3)

    expect(entry.percent).toBe(80)
    expect(entry.level).toBe('warning')
  })

  it('computes in whole cents: 2.90 of 10.00 is 29', () => {
    expect(projectBudgetEntry('p', 2.9, 10).percent).toBe(29)
  })

  it('does not round the ratio', () => {
    expect(projectBudgetEntry('p', 1, 3).ratio).toBe(1 / 3)
  })

  it('floors the percent', () => {
    expect(projectBudgetEntry('p', 0.01, 3).percent).toBe(0)
    expect(projectBudgetEntry('p', 2.99, 3).percent).toBe(99)
  })
})

describe('listProjectBudgets', () => {
  const list = (records: ReturnType<typeof record>[], budgets: [string, number][] = []) =>
    listProjectBudgets(records, new Map(budgets), '2026-10', TIME_ZONE, pricing)

  it('lists each project once, sorted by code point (A-01, A-02)', () => {
    const entries = list([
      record('b', 100, IN_MONTH),
      record('B', 100, IN_MONTH),
      record('a', 100, IN_MONTH),
      record('search, v2', 100, IN_MONTH),
      record('a', 100, IN_MONTH),
    ])

    expect(entries.map((entry) => entry.project)).toEqual(['B', 'a', 'b', 'search, v2'])
  })

  it('lists a project with records only in another month, spent 0 (A-03)', () => {
    const entries = list([record('old', 500, OTHER_MONTH)])

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ project: 'old', spent: 0, level: 'none' })
  })

  it('spent 0, percent 0 and level ok for a budget with only unpriced records (A-04)', () => {
    const entries = list([record('code-review', 500, IN_MONTH, 'constructor')], [['code-review', 10]])

    expect(entries[0]).toMatchObject({ spent: 0, percent: 0, level: 'ok', budget: 10 })
  })

  it('answers an empty list without records (A-05)', () => {
    expect(list([])).toEqual([])
  })

  it('spent is the cost this month rounded to cents, priced records only', () => {
    const entries = list([
      record('p', 799, IN_MONTH),
      record('p', 1, OTHER_MONTH),
      record('p', 5, IN_MONTH, 'constructor'),
    ])

    expect(entries[0]?.spent).toBe(7.99)
  })

  it('keeps projects that differ only in case apart', () => {
    const entries = list(
      [record('Code-Review', 100, IN_MONTH), record('code-review', 100, IN_MONTH)],
      [['code-review', 5]],
    )

    expect(entries.map((entry) => [entry.project, entry.budget])).toEqual([
      ['Code-Review', null],
      ['code-review', 5],
    ])
  })
})
