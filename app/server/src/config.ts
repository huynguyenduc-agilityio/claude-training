export interface AppConfig {
  port: number
  dbPath: string
  timeZone: string
  monthlyBudgetUsd: number
}

const toNumber = (value: string | undefined, fallback: number, name: string): number => {
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  if (Number.isNaN(parsed)) throw new Error(`${name} must be a number, got "${value}"`)
  return parsed
}

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => ({
  port: toNumber(env.API_PORT, 4000, 'API_PORT'),
  dbPath: env.DB_PATH || 'data/usage.db',
  timeZone: env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh',
  monthlyBudgetUsd: toNumber(env.MONTHLY_BUDGET_USD, 30, 'MONTHLY_BUDGET_USD'),
})
