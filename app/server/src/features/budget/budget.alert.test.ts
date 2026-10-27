import { describe, expect, it, vi } from 'vitest'
import { budgetStatus } from './budget.ts'
import { createBudgetNotifier, crossesThreshold, WEBHOOK_TIMEOUT_MS } from './budget.alert.ts'

describe('crossesThreshold', () => {
  const status = (spent: number) => budgetStatus(spent, 30)

  it('is true from ok to warning', () => {
    expect(crossesThreshold(status(10), status(24))).toBe(true)
  })

  it('is true from ok to exceeded', () => {
    expect(crossesThreshold(status(10), status(31))).toBe(true)
  })

  it('is true from warning to exceeded', () => {
    expect(crossesThreshold(status(24), status(31))).toBe(true)
  })

  it('is false from exceeded to exceeded', () => {
    expect(crossesThreshold(status(31), status(32))).toBe(false)
  })

  it('is false when the level falls', () => {
    expect(crossesThreshold(status(31), status(24))).toBe(false)
    expect(crossesThreshold(status(24), status(10))).toBe(false)
  })

  it('is false from warning to warning', () => {
    expect(crossesThreshold(status(24), status(25))).toBe(false)
  })

  it('is false from ok to ok', () => {
    expect(crossesThreshold(status(10), status(11))).toBe(false)
  })
})

describe('createBudgetNotifier', () => {
  it('logs a warning message', () => {
    const log = vi.fn()
    const notify = createBudgetNotifier({ webhookUrl: undefined, log, post: vi.fn() })

    notify('2026-10', budgetStatus(24.3, 30))

    expect(log).toHaveBeenCalledWith('Budget warning: $24.30 of $30.00 spent in 2026-10 (81%)')
  })

  it('logs an exceeded message', () => {
    const log = vi.fn()
    const notify = createBudgetNotifier({ webhookUrl: undefined, log, post: vi.fn() })

    notify('2026-10', budgetStatus(31.2, 30))

    expect(log).toHaveBeenCalledWith('Budget exceeded: $31.20 of $30.00 spent in 2026-10 (104%)')
  })

  it('posts the status as JSON when a webhook URL is set', () => {
    const post = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const notify = createBudgetNotifier({ webhookUrl: 'http://hook.test/budget', log: vi.fn(), post })

    notify('2026-10', budgetStatus(24.3, 30))

    expect(post).toHaveBeenCalledTimes(1)
    const [url, init] = post.mock.calls[0]!
    expect(url).toBe('http://hook.test/budget')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'content-type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({
      month: '2026-10',
      spent: 24.3,
      budget: 30,
      percent: 81,
      level: 'warning',
    })
  })

  it('aborts the post after the timeout', () => {
    const post = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const notify = createBudgetNotifier({ webhookUrl: 'http://hook.test/budget', log: vi.fn(), post })

    notify('2026-10', budgetStatus(24.3, 30))

    const [, init] = post.mock.calls[0]!
    expect(WEBHOOK_TIMEOUT_MS).toBe(5000)
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('does not post when no webhook URL is set', () => {
    const post = vi.fn()
    const notify = createBudgetNotifier({ webhookUrl: undefined, log: vi.fn(), post })

    notify('2026-10', budgetStatus(24.3, 30))

    expect(post).not.toHaveBeenCalled()
  })

  it('catches and logs a rejected post', async () => {
    const log = vi.fn()
    const post = vi.fn().mockRejectedValue(new Error('connection refused'))
    const notify = createBudgetNotifier({ webhookUrl: 'http://hook.test/budget', log, post })

    expect(() => notify('2026-10', budgetStatus(24.3, 30))).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(log).toHaveBeenCalledWith('Budget webhook failed: connection refused')
  })

  it('catches and logs a post that times out', async () => {
    const log = vi.fn()
    const post = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
    const notify = createBudgetNotifier({ webhookUrl: 'http://hook.test/budget', log, post })

    expect(() => notify('2026-10', budgetStatus(24.3, 30))).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(log).toHaveBeenCalledWith(
      'Budget webhook failed: The operation was aborted due to timeout',
    )
  })
})
