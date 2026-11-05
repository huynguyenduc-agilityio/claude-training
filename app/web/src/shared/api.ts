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

export interface NewUsageInput {
  timestamp: string
  model: string
  project: string
  inputTokens: number | null
  outputTokens: number | null
  cachedInputTokens: number | null
}

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

const getJson = async <T>(path: string): Promise<T> => readJson<T>(await fetch(path))

export const fetchSummary = (month: string) =>
  getJson<MonthlySummary>(`/api/summary?month=${encodeURIComponent(month)}`)

export const fetchUsage = (month: string) =>
  getJson<MonthlyUsage>(`/api/usage?month=${encodeURIComponent(month)}`)

export const fetchModels = () => getJson<string[]>('/api/models')

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
