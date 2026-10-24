import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../app.ts'
import type { AppConfig } from '../../config.ts'
import { openDatabase } from '../../shared/db.ts'
import { createUsageRepository } from './usage.repository.ts'

const pricing = {
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

const config: AppConfig = {
  port: 0,
  dbPath: ':memory:',
  timeZone: 'Asia/Ho_Chi_Minh',
  monthlyBudgetUsd: 30,
}

describe('POST /api/usage', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>
  let baseUrl: string

  beforeAll(async () => {
    const repository = createUsageRepository(openDatabase(':memory:'))
    server = createApp({ repository, pricing, config }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => {
    server.close()
  })

  const post = (body: unknown) =>
    fetch(`${baseUrl}/api/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('rejects a negative token count with 400 (EXP-105)', async () => {
    const response = await post({
      timestamp: '2026-10-10T08:00:00Z',
      model: 'orion-mini',
      project: 'support-bot',
      inputTokens: -50000,
      outputTokens: 200,
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'inputTokens must not be negative' })
  })
})
