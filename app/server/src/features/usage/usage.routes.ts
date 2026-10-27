import { Router } from 'express'
import type { AppConfig } from '../../config.ts'
import { ValidationError } from '../../shared/errors.ts'
import { currentMonthKey, isMonthKey } from '../../shared/time.ts'
import type { createBudgetAlert } from '../budget/budget.alert.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import { toUsageCsv } from './usage.csv.ts'
import { listMonth } from './usage.query.ts'
import type { UsageRepository } from './usage.repository.ts'
import { parseNewUsageRecord } from './usage.validation.ts'

interface Deps {
  repository: UsageRepository
  pricing: PriceTable
  config: AppConfig
  budgetAlert: ReturnType<typeof createBudgetAlert>
}

export const readMonth = (value: unknown, timeZone: string): string => {
  if (value === undefined) return currentMonthKey(timeZone)
  if (typeof value !== 'string' || !isMonthKey(value)) {
    throw new ValidationError('month must be YYYY-MM')
  }
  return value
}

export const createUsageRouter = ({ repository, pricing, config, budgetAlert }: Deps): Router => {
  const router = Router()

  router.get('/', (req, res) => {
    const month = readMonth(req.query.month, config.timeZone)
    res.json(listMonth(repository.listAll(), month, config.timeZone, pricing))
  })

  router.get('/export.csv', (req, res) => {
    const month = readMonth(req.query.month, config.timeZone)
    const usage = listMonth(repository.listAll(), month, config.timeZone, pricing)
    res.type('text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="usage-${month}.csv"`)
    res.send(toUsageCsv(usage, config.timeZone))
  })

  router.post('/', (req, res) => {
    const record = budgetAlert.track(() =>
      repository.insert(parseNewUsageRecord(req.body, pricing)),
    )
    res.status(201).json(record)
  })

  return router
}
