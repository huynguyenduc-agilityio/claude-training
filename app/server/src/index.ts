import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createBudgetNotifier } from './features/budget/budget.alert.ts'
import { loadPricing } from './features/pricing/pricing.ts'
import { createUsageRepository } from './features/usage/usage.repository.ts'
import { openDatabase } from './shared/db.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional; defaults from config.ts apply
}

const config = loadConfig()
const repository = createUsageRepository(openDatabase(config.dbPath))
const app = createApp({
  repository,
  pricing: loadPricing(),
  config,
  notifyBudget: createBudgetNotifier({ webhookUrl: config.budgetAlertWebhookUrl }),
})

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (time zone ${config.timeZone})`)
})
