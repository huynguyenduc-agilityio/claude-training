export interface UsageRecord {
  id: number
  /** ISO 8601 timestamp in UTC, e.g. 2026-09-14T03:12:00Z */
  timestamp: string
  model: string
  project: string
  inputTokens: number
  outputTokens: number
  /** Part of inputTokens served from the prompt cache. Null for records imported before cache tracking. */
  cachedInputTokens: number | null
}

export type NewUsageRecord = Omit<UsageRecord, 'id'>
