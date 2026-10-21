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
  budget: BudgetStatus
}

export interface PricedUsageRecord {
  id: number
  timestamp: string
  model: string
  project: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number | null
  cost: number
}

export interface MonthlyUsage {
  month: string
  items: PricedUsageRecord[]
  totalCost: number
}

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export const fetchSummary = (month: string) =>
  getJson<MonthlySummary>(`/api/summary?month=${encodeURIComponent(month)}`)

export const fetchUsage = (month: string) =>
  getJson<MonthlyUsage>(`/api/usage?month=${encodeURIComponent(month)}`)
