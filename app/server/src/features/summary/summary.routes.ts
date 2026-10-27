import { Router } from 'express'
import type { AppConfig } from '../../config.ts'
import { currentMonthKey } from '../../shared/time.ts'
import { budgetStatus } from '../budget/budget.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import type { UsageRepository } from '../usage/usage.repository.ts'
import { readMonth } from '../usage/usage.routes.ts'
import { summarizeMonth } from './summary.ts'

interface Deps {
  repository: UsageRepository
  pricing: PriceTable
  config: AppConfig
}

export const createSummaryRouter = ({ repository, pricing, config }: Deps): Router => {
  const router = Router()

  router.get('/', (req, res) => {
    const month = readMonth(req.query.month, config.timeZone)
    const summary = summarizeMonth(repository.listAll(), month, config.timeZone, pricing)
    res.json({
      ...summary,
      budget: budgetStatus(summary.totalCost, config.monthlyBudgetUsd),
      isCurrentMonth: month === currentMonthKey(config.timeZone),
    })
  })

  return router
}
