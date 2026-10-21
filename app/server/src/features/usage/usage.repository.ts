import type { DatabaseSync } from 'node:sqlite'
import type { NewUsageRecord, UsageRecord } from './usage.ts'

interface UsageRow {
  id: number
  timestamp: string
  model: string
  project: string
  input_tokens: number
  output_tokens: number
  cached_input_tokens: number | null
}

const toRecord = (row: UsageRow): UsageRecord => ({
  id: row.id,
  timestamp: row.timestamp,
  model: row.model,
  project: row.project,
  inputTokens: row.input_tokens,
  outputTokens: row.output_tokens,
  cachedInputTokens: row.cached_input_tokens,
})

export interface UsageRepository {
  insert: (record: NewUsageRecord) => UsageRecord
  listAll: () => UsageRecord[]
  clear: () => void
}

export const createUsageRepository = (db: DatabaseSync): UsageRepository => {
  const insertStatement = db.prepare(
    `INSERT INTO usage_records
       (timestamp, model, project, input_tokens, output_tokens, cached_input_tokens)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  const listStatement = db.prepare('SELECT * FROM usage_records ORDER BY timestamp')

  return {
    insert: (record) => {
      const result = insertStatement.run(
        record.timestamp,
        record.model,
        record.project,
        record.inputTokens,
        record.outputTokens,
        record.cachedInputTokens,
      )
      return { id: Number(result.lastInsertRowid), ...record }
    },
    listAll: () => (listStatement.all() as unknown as UsageRow[]).map(toRecord),
    clear: () => {
      db.exec('DELETE FROM usage_records')
    },
  }
}
