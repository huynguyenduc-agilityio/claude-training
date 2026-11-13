import { mkdtempSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../app.ts'
import type { AppConfig } from '../../config.ts'
import { openDatabase } from '../../shared/db.ts'
import { currentMonthKey } from '../../shared/time.ts'
import { createUsageRepository } from '../usage/usage.repository.ts'
import { createProjectBudgetRepository } from './project-budget.repository.ts'

const pricing = {
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

const config: AppConfig = {
  port: 0,
  dbPath: ':memory:',
  timeZone: 'Asia/Ho_Chi_Minh',
  monthlyBudgetUsd: 30,
}

const NOW = () => new Date().toISOString()
const PAST = '2020-01-15T00:00:00.000Z'

// 1 million input tokens cost exactly $1 with orion-mini, so 10 000 tokens cost 1 cent
const spend = (project: string, cents: number, timestamp = NOW(), model = 'orion-mini') => ({
  timestamp,
  model,
  project,
  inputTokens: cents * 10_000,
  outputTokens: 0,
  cachedInputTokens: null,
})

type Spend = ReturnType<typeof spend>

const servers: ReturnType<ReturnType<typeof createApp>['listen']>[] = []
const databases: DatabaseSync[] = []
afterEach(() => {
  for (const server of servers.splice(0)) server.close()
  for (const db of databases.splice(0)) db.close()
})

const listen = async (app: ReturnType<typeof createApp>) => {
  const server = app.listen(0)
  servers.push(server)
  await new Promise((resolve) => server.once('listening', resolve))
  return `http://localhost:${(server.address() as AddressInfo).port}`
}

const start = async (
  records: Spend[],
  options: { db?: DatabaseSync; notifyBudget?: () => void; withBudgets?: boolean } = {},
) => {
  const db = options.db ?? openDatabase(':memory:')
  databases.push(db)
  const repository = createUsageRepository(db)
  for (const record of records) repository.insert(record)
  const baseUrl = await listen(
    createApp({
      repository,
      pricing,
      config,
      notifyBudget: options.notifyBudget,
      ...(options.withBudgets === false
        ? {}
        : { projectBudgets: createProjectBudgetRepository(db) }),
    }),
  )

  const url = (project: string) => `${baseUrl}/api/project-budgets/${encodeURIComponent(project)}`
  const json = { 'content-type': 'application/json' }
  return {
    baseUrl,
    list: async () => (await fetch(`${baseUrl}/api/project-budgets`)).json(),
    entry: async (project: string) => {
      const body = await (await fetch(`${baseUrl}/api/project-budgets`)).json()
      return body.projects.find((item: { project: string }) => item.project === project)
    },
    put: (project: string, body: unknown) =>
      fetch(url(project), { method: 'PUT', headers: json, body: JSON.stringify(body) }),
    putRaw: (project: string, body: string) =>
      fetch(url(project), { method: 'PUT', headers: json, body }),
    putNoBody: (project: string) => fetch(url(project), { method: 'PUT' }),
    del: (project: string) => fetch(url(project), { method: 'DELETE' }),
    summary: async () => (await fetch(`${baseUrl}/api/summary`)).json(),
  }
}

const THREE = [
  spend('support-bot', 100),
  spend('code-review', 200),
  spend('docs-search', 120),
]

describe('GET /api/project-budgets', () => {
  it('lists each project once with the current month (A-01)', async () => {
    const api = await start([...THREE, spend('code-review', 50)])

    const response = await fetch(`${api.baseUrl}/api/project-budgets`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.month).toBe(currentMonthKey(config.timeZone))
    expect(body.projects.map((p: { project: string }) => p.project)).toEqual([
      'code-review',
      'docs-search',
      'support-bot',
    ])
  })

  it('sorts by code point: uppercase before lowercase (A-02)', async () => {
    const api = await start(['b', 'B', 'a', 'search, v2'].map((name) => spend(name, 1)))

    const body = await api.list()

    expect(body.projects.map((p: { project: string }) => p.project)).toEqual([
      'B',
      'a',
      'b',
      'search, v2',
    ])
  })

  it('lists a project that has records only in a past month, spent 0 (A-03)', async () => {
    const api = await start([spend('old', 500, PAST)])

    expect(await api.entry('old')).toMatchObject({ spent: 0, budget: null, level: 'none' })
  })

  it('answers 200 with an empty list when there are no usage records (A-05)', async () => {
    const api = await start([])

    const response = await fetch(`${api.baseUrl}/api/project-budgets`)

    expect(response.status).toBe(200)
    expect((await response.json()).projects).toEqual([])
  })

  it('shows a project without budget as none with its spending (A-06)', async () => {
    const api = await start(THREE)

    expect(await api.entry('docs-search')).toEqual({
      project: 'docs-search',
      budget: null,
      spent: 1.2,
      ratio: null,
      percent: null,
      level: 'none',
    })
  })

  it('gives spent 0 and level ok with a budget and only unpriced records (A-04)', async () => {
    const api = await start([spend('code-review', 500, NOW(), 'constructor')])
    await api.put('code-review', { budgetUsd: 10 })

    expect(await api.entry('code-review')).toMatchObject({ spent: 0, percent: 0, level: 'ok' })
  })

  it.each([
    [0, 0, 'ok'],
    [799, 79, 'ok'],
    [800, 80, 'warning'],
    [999, 99, 'warning'],
    [1000, 100, 'exceeded'],
    [1250, 125, 'exceeded'],
  ])('budget 10.00 with %s cents spent gives percent %s and level %s (A-07)', async (cents, percent, level) => {
    const api = await start([spend('code-review', cents), spend('other', 1)])
    await api.put('code-review', { budgetUsd: 10 })

    const entry = await api.entry('code-review')

    expect(entry.spent).toBe(cents / 100)
    expect(entry.percent).toBe(percent)
    expect(entry.level).toBe(level)
    expect(entry.ratio).toBe(cents / 100 / 10)
  })

  it('answers 80 and warning for 2.40 of 3.00 (A-08)', async () => {
    const api = await start([spend('p', 240)])
    await api.put('p', { budgetUsd: 3 })

    expect(await api.entry('p')).toMatchObject({ percent: 80, level: 'warning' })
  })

  it('answers 29 for 2.90 of 10.00 (A-09)', async () => {
    const api = await start([spend('p', 290)])
    await api.put('p', { budgetUsd: 10 })

    expect((await api.entry('p')).percent).toBe(29)
  })

  it('spent equals the byProject cost of GET /api/summary (A-10)', async () => {
    const api = await start([...THREE, spend('code-review', 33), spend('code-review', 7, PAST)])

    const summary = await api.summary()
    const body = await api.list()

    for (const item of summary.byProject) {
      const entry = body.projects.find((p: { project: string }) => p.project === item.key)
      expect(entry.spent).toBe(item.cost)
    }
  })

  it('ignores the month parameter (A-31)', async () => {
    const api = await start([...THREE, spend('code-review', 50, PAST)])

    const plain = await api.list()
    const withMonth = await (await fetch(`${api.baseUrl}/api/project-budgets?month=2026-01`)).json()

    expect(withMonth).toEqual(plain)
  })
})

describe('PUT /api/project-budgets/:project', () => {
  it('sets a budget and answers the entry (A-11)', async () => {
    const api = await start(THREE)

    const response = await api.put('code-review', { budgetUsd: 12.5 })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      project: 'code-review',
      budget: 12.5,
      spent: 2,
      ratio: 2 / 12.5,
      percent: 16,
      level: 'ok',
    })
    expect((await api.entry('code-review')).budget).toBe(12.5)
  })

  it('changes a budget (A-12)', async () => {
    const api = await start(THREE)
    await api.put('code-review', { budgetUsd: 10 })

    await api.put('code-review', { budgetUsd: 20 })

    expect((await api.entry('code-review')).budget).toBe(20)
  })

  it.each([1_000_000, 0.01, 131072.02, 999999.99])('accepts %s (A-18)', async (budgetUsd) => {
    const api = await start(THREE)

    const response = await api.put('code-review', { budgetUsd })

    expect(response.status).toBe(200)
    expect((await response.json()).budget).toBe(budgetUsd)
  })

  it.each([
    [{ budgetUsd: 0 }, 'budgetUsd must be greater than 0'],
    [{ budgetUsd: -5 }, 'budgetUsd must be greater than 0'],
    [{ budgetUsd: 1e-12 }, 'budgetUsd must be greater than 0'],
    [{ budgetUsd: -5.005 }, 'budgetUsd must be greater than 0'],
    [{ budgetUsd: 10.005 }, 'budgetUsd must have at most 2 decimals'],
    [{ budgetUsd: 999999.995 }, 'budgetUsd must have at most 2 decimals'],
    [{ budgetUsd: 1000000.01 }, 'budgetUsd must be at most 1000000'],
    [{ budgetUsd: '10' }, 'budgetUsd must be a number'],
    [{ budgetUsd: null }, 'budgetUsd must be a number'],
    [{ budgetUsd: true }, 'budgetUsd must be a number'],
    [{ budgetUsd: [1] }, 'budgetUsd must be a number'],
    [{ budgetUsd: {} }, 'budgetUsd must be a number'],
    [{}, 'budgetUsd must be a number'],
    [{ other: 1 }, 'budgetUsd must be a number'],
    [[], 'budgetUsd must be a number'],
  ])('rejects %j with 400 and leaves the budget unchanged (A-15 to A-19, A-21)', async (body, error) => {
    const api = await start(THREE)
    await api.put('code-review', { budgetUsd: 10 })

    const response = await api.put('code-review', body)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error })
    expect((await api.entry('code-review')).budget).toBe(10)
  })

  it('rejects a request with no body as "must be a number" (A-19)', async () => {
    const api = await start(THREE)

    const response = await api.putNoBody('code-review')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'budgetUsd must be a number' })
  })

  it('rejects 1e999 (Infinity) as "must be a number" (A-19)', async () => {
    const api = await start(THREE)

    const response = await api.putRaw('code-review', '{"budgetUsd": 1e999}')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'budgetUsd must be a number' })
  })

  it.each(['null', '5', '{bad'])('answers 500 for the body %s, as every endpoint does (A-20)', async (raw) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const api = await start(THREE)

    const response = await api.putRaw('code-review', raw)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
    consoleError.mockRestore()
  })

  it('ignores fields other than budgetUsd (A-22)', async () => {
    const api = await start(THREE)

    const response = await api.put('code-review', { budgetUsd: 5, extra: 1 })

    expect(response.status).toBe(200)
    expect((await response.json()).budget).toBe(5)
  })

  it('stores and returns 10.000000000001 as 10 (A-30)', async () => {
    const api = await start(THREE)

    const response = await api.put('code-review', { budgetUsd: 10.000000000001 })

    expect((await response.json()).budget).toBe(10)
    expect((await api.entry('code-review')).budget).toBe(10)
  })

  it('answers 404 for a project without records (A-23)', async () => {
    const api = await start(THREE)

    const response = await api.put('new-team', { budgetUsd: 10 })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'project not found' })
    expect((await api.list()).projects.map((p: { project: string }) => p.project)).not.toContain(
      'new-team',
    )
  })

  it('checks the project before the body (A-24)', async () => {
    const api = await start(THREE)

    expect((await api.put('new-team', { budgetUsd: 'x' })).status).toBe(404)
    expect((await api.putNoBody('new-team')).status).toBe(404)
  })

  it('works for names with spaces, commas and quotes (A-25)', async () => {
    const api = await start([spend('search, v2', 100), spend('say "hi"', 100), spend('a b', 100)])

    for (const project of ['search, v2', 'say "hi"', 'a b']) {
      const response = await api.put(project, { budgetUsd: 7 })
      expect(response.status).toBe(200)
      expect((await response.json()).project).toBe(project)
    }
  })

  it('matches the project exactly, including case (A-26)', async () => {
    const api = await start([spend('code-review', 100)])

    expect((await api.put('Code-Review', { budgetUsd: 10 })).status).toBe(404)
    expect((await api.put('code-review', { budgetUsd: 10 })).status).toBe(200)
  })

  it('keeps projects that differ only in case apart', async () => {
    const api = await start([spend('b', 100), spend('B', 100)])

    await api.put('b', { budgetUsd: 1 })
    await api.put('B', { budgetUsd: 2 })

    expect((await api.entry('b')).budget).toBe(1)
    expect((await api.entry('B')).budget).toBe(2)
  })
})

describe('DELETE /api/project-budgets/:project', () => {
  it('removes a budget and answers 204 (A-13)', async () => {
    const api = await start(THREE)
    await api.put('code-review', { budgetUsd: 10 })

    const response = await api.del('code-review')

    expect(response.status).toBe(204)
    expect(await api.entry('code-review')).toMatchObject({
      budget: null,
      ratio: null,
      percent: null,
      level: 'none',
    })
  })

  it('answers 204 when no budget is set (A-14)', async () => {
    const api = await start(THREE)

    expect((await api.del('docs-search')).status).toBe(204)
  })

  it('answers 404 for a project without records (A-23)', async () => {
    const api = await start(THREE)

    const response = await api.del('new-team')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'project not found' })
  })
})

describe('storage (EXP-112 scenario 10, R6)', () => {
  it('keeps a budget when the API restarts on the same database file (A-27)', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'project-budgets-'))
    const file = join(folder, 'usage.db')
    try {
      const first = await start(THREE, { db: openDatabase(file) })
      await first.put('code-review', { budgetUsd: 10 })
      servers.splice(0).forEach((server) => server.close())
      databases.splice(0).forEach((db) => db.close())

      const second = await start([], { db: openDatabase(file) })

      expect((await second.entry('code-review')).budget).toBe(10)
    } finally {
      for (const server of servers.splice(0)) server.close()
      for (const db of databases.splice(0)) db.close()
      rmSync(folder, { recursive: true, force: true })
    }
  })

  it('works when createApp gets no project budget repository', async () => {
    const api = await start(THREE, { withBudgets: false })

    expect((await api.put('code-review', { budgetUsd: 10 })).status).toBe(200)
    expect((await api.entry('code-review')).budget).toBe(10)
  })
})

describe('the company-wide budget (R7, A-29)', () => {
  it('leaves GET /api/summary, logs and the webhook alone when budgets change', async () => {
    const notifyBudget = vi.fn()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const api = await start([spend('code-review', 2700)], { notifyBudget })
    const before = await api.summary()

    await api.put('code-review', { budgetUsd: 10 })
    await api.put('code-review', { budgetUsd: 50 })
    await api.del('code-review')
    const after = await api.summary()

    expect(before.budget.level).toBe('warning')
    expect(after).toEqual(before)
    expect(notifyBudget).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })
})
