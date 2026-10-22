import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../app.ts'
import type { AppConfig } from '../../config.ts'
import { openDatabase } from '../../shared/db.ts'
import { createUsageRepository } from '../usage/usage.repository.ts'

const pricing = {
  'orion-mini': { inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 },
}

const config: AppConfig = {
  port: 0,
  dbPath: ':memory:',
  timeZone: 'Asia/Ho_Chi_Minh',
  monthlyBudgetUsd: 30,
}

const record = (timestamp: string) => ({
  timestamp,
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 100_000,
  outputTokens: 20_000,
  cachedInputTokens: null,
})

describe('GET /api/summary', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>
  let baseUrl: string

  beforeAll(async () => {
    const repository = createUsageRepository(openDatabase(':memory:'))
    // 2026-09-30 20:00 UTC is 2026-10-01 03:00 in Ho Chi Minh City (UTC+7)
    repository.insert(record('2026-09-30T20:00:00.000Z'))
    repository.insert(record('2026-10-15T04:00:00.000Z'))

    server = createApp({ repository, pricing, config }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => {
    server.close()
  })

  const get = async (path: string) => (await fetch(`${baseUrl}${path}`)).json()

  it('counts a record in the month of the configured time zone (EXP-101)', async () => {
    const october = await get('/api/summary?month=2026-10')
    const september = await get('/api/summary?month=2026-09')

    expect(october.recordCount).toBe(2)
    expect(september.recordCount).toBe(0)
  })

  it('matches the usage records total for the same month (EXP-101)', async () => {
    const summary = await get('/api/summary?month=2026-10')
    const usage = await get('/api/usage?month=2026-10')

    expect(summary.totalCost).toBe(usage.totalCost)
    expect(summary.recordCount).toBe(usage.items.length)
    expect(summary.budget.spent).toBe(usage.totalCost)
    expect(summary.budget.ratio).toBe(usage.totalCost / config.monthlyBudgetUsd)
  })
})
