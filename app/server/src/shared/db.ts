import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  model TEXT NOT NULL,
  project TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cached_input_tokens INTEGER
);
CREATE TABLE IF NOT EXISTS project_budgets (
  project TEXT PRIMARY KEY,
  budget_cents INTEGER NOT NULL
)`

export const openDatabase = (path: string): DatabaseSync => {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(SCHEMA)
  return db
}
