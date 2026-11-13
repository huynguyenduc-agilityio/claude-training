import { loadConfig } from '../src/config.ts'
import { createProjectBudgetRepository } from '../src/features/budget/project-budget.repository.ts'
import { createUsageRepository } from '../src/features/usage/usage.repository.ts'
import type { NewUsageRecord } from '../src/features/usage/usage.ts'
import { openDatabase } from '../src/shared/db.ts'

/**
 * Replaces all usage records with a deterministic sample: Aug 1 – Oct 19 2026,
 * three projects, three models. Same seed, same data on every machine.
 */

try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional
}

// Small linear congruential generator so the sample is reproducible
let state = 20261001
const random = (): number => {
  state = (state * 1664525 + 1013904223) % 2 ** 32
  return state / 2 ** 32
}
const between = (min: number, max: number): number => Math.floor(min + random() * (max - min + 1))
const pick = <T>(weighted: [T, number][]): T => {
  let roll = random()
  for (const [value, weight] of weighted) {
    roll -= weight
    if (roll < 0) return value
  }
  return weighted[weighted.length - 1]![0]
}

const PROJECT_MODELS: Record<string, [string, number][]> = {
  'support-bot': [
    ['orion-mini', 0.7],
    ['orion-large', 0.3],
  ],
  'code-review': [
    ['orion-large', 0.8],
    ['lyra-flash', 0.2],
  ],
  'docs-search': [['lyra-flash', 1]],
}

// Cache tracking started on Sep 1; older records were imported without it
const CACHE_TRACKING_FROM = '2026-09-01'

const START = Date.UTC(2026, 7, 1)
const END = Date.UTC(2026, 9, 19)
const DAY = 24 * 60 * 60 * 1000

const records: NewUsageRecord[] = []
for (let day = START; day <= END; day += DAY) {
  const count = between(8, 14)
  for (let i = 0; i < count; i++) {
    const project = pick<string>([
      ['support-bot', 0.4],
      ['code-review', 0.35],
      ['docs-search', 0.25],
    ])
    const model = pick(PROJECT_MODELS[project]!)
    const at = new Date(day + between(0, 23) * 3_600_000 + between(0, 59) * 60_000)
    const inputTokens = between(2_000, 60_000)
    const tracked = at.toISOString().slice(0, 10) >= CACHE_TRACKING_FROM
    const cachedInputTokens = !tracked
      ? null
      : model === 'orion-large'
        ? Math.floor(inputTokens * (between(30, 80) / 100))
        : 0

    records.push({
      timestamp: at.toISOString(),
      model,
      project,
      inputTokens,
      outputTokens: between(300, 4_000),
      cachedInputTokens,
    })
  }
}

const config = loadConfig()
const db = openDatabase(config.dbPath)
const repository = createUsageRepository(db)
repository.clear()
// Budgets are not part of the sample data, so every machine starts without any
createProjectBudgetRepository(db).clear()
for (const record of records) repository.insert(record)

console.log(`Seeded ${records.length} usage records into ${config.dbPath}`)
