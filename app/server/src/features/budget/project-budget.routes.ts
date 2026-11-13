import { Router } from 'express'
import type { AppConfig } from '../../config.ts'
import { currentMonthKey } from '../../shared/time.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import type { UsageRepository } from '../usage/usage.repository.ts'
import type { ProjectBudgetRepository } from './project-budget.repository.ts'
import { listProjectBudgets } from './project-budget.status.ts'
import { parseBudgetUsd } from './project-budget.validation.ts'

interface Deps {
  repository: UsageRepository
  projectBudgets: ProjectBudgetRepository
  pricing: PriceTable
  config: AppConfig
}

export const createProjectBudgetRouter = ({
  repository,
  projectBudgets,
  pricing,
  config,
}: Deps): Router => {
  const router = Router()

  const entries = () =>
    listProjectBudgets(
      repository.listAll(),
      projectBudgets.list(),
      currentMonthKey(config.timeZone),
      config.timeZone,
      pricing,
    )

  // A project exists when some usage record has exactly that name, case included.
  const projectExists = (project: string): boolean =>
    repository.listAll().some((record) => record.project === project)

  router.get('/', (_req, res) => {
    res.json({ month: currentMonthKey(config.timeZone), projects: entries() })
  })

  router.put('/:project', (req, res) => {
    const { project } = req.params
    if (!projectExists(project)) {
      res.status(404).json({ error: 'project not found' })
      return
    }
    projectBudgets.set(project, parseBudgetUsd(req.body))
    res.json(entries().find((entry) => entry.project === project))
  })

  router.delete('/:project', (req, res) => {
    const { project } = req.params
    if (!projectExists(project)) {
      res.status(404).json({ error: 'project not found' })
      return
    }
    projectBudgets.remove(project)
    res.status(204).end()
  })

  return router
}
