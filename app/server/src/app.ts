import express, { type ErrorRequestHandler } from 'express'
import type { AppConfig } from './config.ts'
import type { PriceTable } from './features/pricing/pricing.ts'
import { createSummaryRouter } from './features/summary/summary.routes.ts'
import type { UsageRepository } from './features/usage/usage.repository.ts'
import { createUsageRouter } from './features/usage/usage.routes.ts'
import { ValidationError } from './shared/errors.ts'

interface Deps {
  repository: UsageRepository
  pricing: PriceTable
  config: AppConfig
}

const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}

export const createApp = (deps: Deps) => {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.get('/api/models', (_req, res) => {
    res.json(Object.keys(deps.pricing))
  })
  app.use('/api/usage', createUsageRouter(deps))
  app.use('/api/summary', createSummaryRouter(deps))

  app.use(handleErrors)
  return app
}
