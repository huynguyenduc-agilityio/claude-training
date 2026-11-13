import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createBudgetNotifier } from './features/budget/budget.alert.ts'
import { createProjectBudgetRepository } from './features/budget/project-budget.repository.ts'
import { loadPricing } from './features/pricing/pricing.ts'
import { createUsageRepository } from './features/usage/usage.repository.ts'
import { openDatabase } from './shared/db.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional; defaults from config.ts apply
}

const config = loadConfig()
const db = openDatabase(config.dbPath)
const repository = createUsageRepository(db)
const app = createApp({
  repository,
  projectBudgets: createProjectBudgetRepository(db),
  pricing: loadPricing(),
  config,
  notifyBudget: createBudgetNotifier({ webhookUrl: config.budgetAlertWebhookUrl }),
})

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (time zone ${config.timeZone})`)
})
