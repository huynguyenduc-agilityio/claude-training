import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../app.ts'
import type { AppConfig } from '../../config.ts'
import { openDatabase } from '../../shared/db.ts'
import { toUsageCsv } from './usage.csv.ts'
import { listMonth } from './usage.query.ts'
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
  const repository = createUsageRepository(openDatabase(':memory:'))

  beforeAll(async () => {
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

  it('rejects cachedInputTokens above inputTokens with 400 and saves nothing (EXP-108)', async () => {
    const response = await post({
      timestamp: '2026-10-15T03:00:00Z',
      model: 'orion-mini',
      project: 'support-bot',
      inputTokens: 100,
      outputTokens: 0,
      cachedInputTokens: 1000000,
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'cachedInputTokens must not exceed inputTokens',
    })
    expect(repository.listAll()).toHaveLength(0)
  })

  it('rejects a token count above the safe integer range with 400 and saves nothing (EXP-106)', async () => {
    const response = await fetch(`${baseUrl}/api/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"timestamp":"2026-10-15T03:00:00Z","model":"orion-mini","project":"support-bot","inputTokens":9007199254740994,"outputTokens":1}',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'inputTokens must not exceed 9007199254740991',
    })
    expect(repository.listAll()).toHaveLength(0)
  })

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    'rejects model %s with 400 and saves nothing (EXP-107)',
    async (model) => {
      const response = await post({
        timestamp: '2026-10-15T03:00:00Z',
        model,
        project: 'support-bot',
        inputTokens: 10,
        outputTokens: 1,
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: `Unknown model: ${model}` })
      expect(repository.listAll()).toHaveLength(0)
    },
  )

  it('accepts a token count equal to Number.MAX_SAFE_INTEGER and reads it back (EXP-106)', async () => {
    const response = await post({
      timestamp: '2026-10-15T03:00:00Z',
      model: 'orion-mini',
      project: 'support-bot',
      inputTokens: Number.MAX_SAFE_INTEGER,
      outputTokens: 1,
    })

    expect(response.status).toBe(201)
    expect(repository.listAll()).toMatchObject([{ inputTokens: Number.MAX_SAFE_INTEGER }])
  })
})

describe('GET /api/usage/export.csv', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>
  let baseUrl: string
  const repository = createUsageRepository(openDatabase(':memory:'))

  beforeAll(async () => {
    repository.insert({
      timestamp: '2026-09-30T18:00:00Z',
      model: 'orion-mini',
      project: 'support-bot',
      inputTokens: 1000,
      outputTokens: 200,
      cachedInputTokens: 400,
    })
    repository.insert({
      timestamp: '2026-10-05T08:00:00Z',
      model: 'orion-mini',
      project: 'search, v2',
      inputTokens: 5000,
      outputTokens: 700,
      cachedInputTokens: null,
    })
    server = createApp({ repository, pricing, config }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => {
    server.close()
  })

  it('downloads the month as CSV (EXP-104)', async () => {
    const response = await fetch(`${baseUrl}/api/usage/export.csv?month=2026-10`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="usage-2026-10.csv"',
    )
    const body = Buffer.from(await response.arrayBuffer()).toString('utf8')
    const usage = listMonth(repository.listAll(), '2026-10', config.timeZone, pricing)
    expect(usage.items).toHaveLength(2)
    expect(body).toBe(toUsageCsv(usage, config.timeZone))
  })

  it('rejects an invalid month with 400', async () => {
    const response = await fetch(`${baseUrl}/api/usage/export.csv?month=2026-13`)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'month must be YYYY-MM' })
  })
})

describe('reads with a row that has no price (EXP-109)', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>
  let baseUrl: string
  const repository = createUsageRepository(openDatabase(':memory:'))
  const row = (model: string, timestamp: string) => ({
    timestamp,
    model,
    project: 'support-bot',
    inputTokens: 100_000,
    outputTokens: 20_000,
    cachedInputTokens: null,
  })

  beforeAll(async () => {
    repository.insert(row('orion-mini', '2026-10-10T08:00:00Z'))
    repository.insert(row('constructor', '2026-10-11T08:00:00Z'))
    repository.insert(row('removed-model', '2026-10-12T08:00:00Z'))
    server = createApp({ repository, pricing, config }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => {
    server.close()
  })

  it('lists the rows with cost null and leaves them out of the total', async () => {
    const response = await fetch(`${baseUrl}/api/usage?month=2026-10`)

    expect(response.status).toBe(200)
    const usage = await response.json()
    expect(usage.items).toHaveLength(3)
    expect(usage.items.filter((item: { cost: number | null }) => item.cost === null)).toHaveLength(2)
    expect(usage.items.find((item: { model: string }) => item.model === 'constructor').cost).toBeNull()
    expect(usage.items.find((item: { model: string }) => item.model === 'removed-model').cost).toBeNull()
    expect(usage.totalCost).toBe(0.2)
  })

  it('exports the rows with an empty cost cell', async () => {
    const response = await fetch(`${baseUrl}/api/usage/export.csv?month=2026-10`)

    expect(response.status).toBe(200)
    const lines = (await response.text()).split('\r\n')
    expect(lines.find((line) => line.includes(',constructor,'))?.endsWith(',')).toBe(true)
    expect(lines.find((line) => line.includes(',removed-model,'))?.endsWith(',')).toBe(true)
  })
})
