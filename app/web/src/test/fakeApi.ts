import { vi } from 'vitest'
import type { MonthlySummary, ProjectBudget } from '../shared/api.ts'
import { thisMonth } from '../shared/format.ts'

export const budgetEntry = (
  project: string,
  budget: number | null,
  spent: number,
  percent: number | null,
  level: ProjectBudget['level'],
): ProjectBudget => ({
  project,
  budget,
  spent,
  ratio: percent === null ? null : percent / 100,
  percent,
  level,
})

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const summaryFor = (month: string, overrides: Partial<MonthlySummary> = {}): MonthlySummary => ({
  month,
  totalCost: 12.34,
  recordCount: 3,
  byModel: [],
  byProject: [],
  unpricedCount: 0,
  budget: { spent: 1, budget: 100, ratio: 0.01, level: 'ok' },
  isCurrentMonth: month === thisMonth(),
  ...overrides,
})

export interface FakeApiOptions {
  /** One handler per call of `/api/project-budgets`; the last one repeats. */
  budgets: Array<() => Promise<Response> | Response>
  summary?: (month: string) => Promise<Response> | Response
}

/** Stubs `fetch` for every endpoint the dashboard calls. Returns the list of requested URLs. */
export const stubApi = (options: FakeApiOptions): string[] => {
  const calls: string[] = []
  let budgetCalls = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      calls.push(`${init?.method ?? 'GET'} ${url}`)
      if (url.startsWith('/api/project-budgets')) {
        const handler = options.budgets[Math.min(budgetCalls, options.budgets.length - 1)]
        budgetCalls += 1
        return handler!()
      }
      if (url.startsWith('/api/summary')) {
        const month = new URL(url, 'http://localhost').searchParams.get('month') ?? thisMonth()
        return options.summary ? options.summary(month) : json(summaryFor(month))
      }
      if (url.startsWith('/api/usage') && init?.method === 'POST') return json({}, 201)
      if (url.startsWith('/api/usage')) {
        const month = new URL(url, 'http://localhost').searchParams.get('month') ?? thisMonth()
        return json({ month, items: [], totalCost: 0 })
      }
      if (url.startsWith('/api/models')) return json(['lyra-flash'])
      throw new Error(`Unexpected request: ${url}`)
    }),
  )
  return calls
}
