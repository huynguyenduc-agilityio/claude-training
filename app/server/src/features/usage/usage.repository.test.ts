import { describe, expect, it } from 'vitest'
import { openDatabase } from '../../shared/db.ts'
import { createUsageRepository } from './usage.repository.ts'

const record = {
  timestamp: '2026-10-02T09:30:00.000Z',
  model: 'orion-mini',
  project: 'support-bot',
  inputTokens: 1200,
  outputTokens: 300,
  cachedInputTokens: null,
}

describe('usage repository', () => {
  it('stores and lists records', () => {
    const repository = createUsageRepository(openDatabase(':memory:'))

    const saved = repository.insert(record)

    expect(saved.id).toBe(1)
    expect(repository.listAll()).toEqual([{ id: 1, ...record }])
  })

  it('clears all records', () => {
    const repository = createUsageRepository(openDatabase(':memory:'))
    repository.insert(record)

    repository.clear()

    expect(repository.listAll()).toEqual([])
  })
})
