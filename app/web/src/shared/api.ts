export interface Breakdown {
  key: string
  cost: number
  records: number
}

export interface BudgetStatus {
  spent: number
  budget: number
  ratio: number
  level: 'ok' | 'warning' | 'exceeded'
}

export interface MonthlySummary {
  month: string
  totalCost: number
  recordCount: number
  byModel: Breakdown[]
  byProject: Breakdown[]
  unpricedCount: number
  budget: BudgetStatus
  isCurrentMonth: boolean
}

export interface PricedUsageRecord {
  id: number
  timestamp: string
  model: string
  project: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number | null
  cost: number | null
}

export interface MonthlyUsage {
  month: string
  items: PricedUsageRecord[]
  totalCost: number
}

export interface ProjectBudget {
  project: string
  budget: number | null
  spent: number
  ratio: number | null
  percent: number | null
  level: 'none' | 'ok' | 'warning' | 'exceeded'
}

export interface ProjectBudgets {
  month: string
  projects: ProjectBudget[]
}

export interface NewUsageInput {
  timestamp: string
  model: string
  project: string
  inputTokens: number | null
  outputTokens: number | null
  cachedInputTokens: number | null
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const failure = async (response: Response): Promise<ApiError> => {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return new ApiError(body.error ?? `Request failed: ${response.status}`, response.status)
}

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) throw await failure(response)
  return (await response.json()) as T
}

const getJson = async <T>(path: string): Promise<T> => readJson<T>(await fetch(path))

export const fetchSummary = (month: string) =>
  getJson<MonthlySummary>(`/api/summary?month=${encodeURIComponent(month)}`)

export const fetchUsage = (month: string) =>
  getJson<MonthlyUsage>(`/api/usage?month=${encodeURIComponent(month)}`)

export const fetchProjectBudgets = () => getJson<ProjectBudgets>('/api/project-budgets')

const projectBudgetPath = (project: string) => `/api/project-budgets/${encodeURIComponent(project)}`

export const saveProjectBudget = async (
  project: string,
  budgetUsd: number | null,
): Promise<void> => {
  const response = await fetch(projectBudgetPath(project), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budgetUsd }),
  })
  await readJson<unknown>(response)
}

// DELETE answers 204 with no body, so there is nothing to parse on success.
export const deleteProjectBudget = async (project: string): Promise<void> => {
  const response = await fetch(projectBudgetPath(project), { method: 'DELETE' })
  if (!response.ok) throw await failure(response)
}

export const fetchModels =() => getJson<string[]>('/api/models')

export const createUsage = async (input: NewUsageInput): Promise<void> => {
  const response = await fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await readJson<unknown>(response)
}

export const usageCsvUrl = (month: string) =>
  `/api/usage/export.csv?month=${encodeURIComponent(month)}`
