import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../app.ts'
import type { AppConfig } from '../../config.ts'
import { openDatabase } from '../../shared/db.ts'
import { currentMonthKey } from '../../shared/time.ts'
import type { PriceTable } from '../pricing/pricing.ts'
import { createUsageRepository } from '../usage/usage.repository.ts'

const pricing = {
  'orion-mini': [{ inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 }],
}

const config: AppConfig = {
  port: 0,
  dbPath: ':memory:',
  timeZone: 'Asia/Ho_Chi_Minh',
  monthlyBudgetUsd: 30,
}

// 1 million input tokens cost exactly $1 with orion-mini
const spendUsd = (dollars: number, timestamp = new Date().toISOString()) => ({
  timestamp,
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: dollars * 1_000_000,
  outputTokens: 0,
  cachedInputTokens: null,
})

describe('budget alert on POST /api/usage', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>

  afterEach(() => {
    server.close()
  })

  const start = async () => {
    const notifyBudget = vi.fn()
    const repository = createUsageRepository(openDatabase(':memory:'))
    server = createApp({ repository, pricing, config, notifyBudget }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
    const post = (body: unknown) =>
      fetch(`${baseUrl}/api/usage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    return { notifyBudget, post, repository }
  }

  it('does not notify while spending stays below 80%', async () => {
    const { notifyBudget, post } = await start()

    expect((await post(spendUsd(20))).status).toBe(201)

    expect(notifyBudget).not.toHaveBeenCalled()
  })

  it('notifies once when an insert crosses 80%', async () => {
    const { notifyBudget, post } = await start()

    await post(spendUsd(20))
    await post(spendUsd(4))

    expect(notifyBudget).toHaveBeenCalledTimes(1)
    expect(notifyBudget).toHaveBeenCalledWith(
      currentMonthKey(config.timeZone),
      expect.objectContaining({ spent: 24, budget: 30, level: 'warning' }),
    )
  })

  it('notifies again when a later insert crosses 100%', async () => {
    const { notifyBudget, post } = await start()

    await post(spendUsd(24))
    await post(spendUsd(7))

    expect(notifyBudget).toHaveBeenCalledTimes(2)
    expect(notifyBudget).toHaveBeenLastCalledWith(
      currentMonthKey(config.timeZone),
      expect.objectContaining({ level: 'exceeded' }),
    )
  })

  it('does not notify again while spending stays in the warning range', async () => {
    const { notifyBudget, post } = await start()

    await post(spendUsd(24))
    await post(spendUsd(1))

    expect(notifyBudget).toHaveBeenCalledTimes(1)
  })

  it('notifies once with level exceeded when one insert jumps past 100%', async () => {
    const { notifyBudget, post } = await start()

    await post(spendUsd(31))

    expect(notifyBudget).toHaveBeenCalledTimes(1)
    expect(notifyBudget).toHaveBeenCalledWith(
      currentMonthKey(config.timeZone),
      expect.objectContaining({ level: 'exceeded' }),
    )
  })

  it('scans the table once per insert', async () => {
    const { post, repository } = await start()
    const listAll = vi.spyOn(repository, 'listAll')

    await post(spendUsd(20))

    expect(listAll).toHaveBeenCalledTimes(1)
  })

  it('does not notify for a record in a past month', async () => {
    const { notifyBudget, post } = await start()

    expect((await post(spendUsd(40, '2020-01-15T00:00:00.000Z'))).status).toBe(201)

    expect(notifyBudget).not.toHaveBeenCalled()
  })
})

describe('budget alert with a row that has no price (EXP-109)', () => {
  let server: ReturnType<ReturnType<typeof createApp>['listen']>

  afterEach(() => {
    server.close()
  })

  const startWith = async (table: PriceTable) => {
    const notifyBudget = vi.fn()
    const repository = createUsageRepository(openDatabase(':memory:'))
    server = createApp({ repository, pricing: table, config, notifyBudget }).listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
    const post = (body: unknown) =>
      fetch(`${baseUrl}/api/usage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    return { notifyBudget, post, repository }
  }

  const insertUnpriced = (repository: ReturnType<typeof createUsageRepository>) =>
    repository.insert({ ...spendUsd(100), model: 'constructor' })

  it('accepts a valid record in a month with such a row', async () => {
    const { post, repository } = await startWith(pricing)
    insertUnpriced(repository)

    expect((await post(spendUsd(1))).status).toBe(201)

    expect(repository.listAll()).toHaveLength(2)
  })

  it('rejects an invalid record in a month with such a row', async () => {
    const { post, repository } = await startWith(pricing)
    insertUnpriced(repository)

    expect((await post({ ...spendUsd(1), inputTokens: -1 })).status).toBe(400)
  })

  it('counts the row as $0 towards the threshold', async () => {
    const { notifyBudget, post, repository } = await startWith(pricing)
    insertUnpriced(repository)

    await post(spendUsd(20))
    expect(notifyBudget).not.toHaveBeenCalled()

    await post(spendUsd(4))
    expect(notifyBudget).toHaveBeenCalledTimes(1)
    expect(notifyBudget).toHaveBeenCalledWith(
      currentMonthKey(config.timeZone),
      expect.objectContaining({ spent: 24, budget: 30, level: 'warning' }),
    )
  })

  it('saves a record with no price at its timestamp without notifying', async () => {
    const { notifyBudget, post, repository } = await startWith({
      'starts-later': [
        { from: '2999-01-01T00:00:00Z', inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 },
      ],
    })

    expect((await post({ ...spendUsd(1), model: 'starts-later' })).status).toBe(201)

    expect(repository.listAll()).toHaveLength(1)
    expect(notifyBudget).not.toHaveBeenCalled()
  })
})
