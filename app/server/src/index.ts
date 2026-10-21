import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
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
const app = createApp({ repository, pricing: loadPricing(), config })

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (time zone ${config.timeZone})`)
})
