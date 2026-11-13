import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { thisMonth } from '../../shared/format.ts'
import { budgetEntry, json, stubApi } from '../../test/fakeApi.ts'
import { useProjectBudgets } from './useProjectBudgets.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const warning = budgetEntry('code-review', 10, 8.12, 81, 'warning')
const exceeded = budgetEntry('code-review', 10, 12.5, 125, 'exceeded')
const reply = (projects: unknown[]) => () => json({ month: thisMonth(), projects })

const deferred = () => {
  let resolve: (response: Response) => void = () => {}
  const promise = new Promise<Response>((done) => (resolve = done))
  return { promise, resolve }
}

describe('useProjectBudgets', () => {
  it('loads once and fills banners and section', async () => {
    stubApi({ budgets: [reply([warning])] })
    const { result } = renderHook(() => useProjectBudgets(0))
    expect(result.current.banners).toEqual({ status: 'loading' })
    expect(result.current.section).toEqual({ status: 'loading' })

    await waitFor(() => expect(result.current.banners.status).toBe('ready'))
    expect(result.current.banners).toEqual({ status: 'ready', projects: [warning] })
    expect(result.current.section).toEqual({
      status: 'ready',
      month: thisMonth(),
      projects: [warning],
    })
  })

  it('refresh keeps the old banners and rows until the response arrives (B-11)', async () => {
    const slow = deferred()
    const calls = stubApi({ budgets: [reply([warning]), () => slow.promise] })
    const { result } = renderHook(() => useProjectBudgets(0))
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    let refreshed: Promise<unknown> = Promise.resolve()
    act(() => {
      refreshed = result.current.refresh()
    })
    expect(result.current.banners).toEqual({ status: 'ready', projects: [warning] })
    expect(result.current.section.status).toBe('ready')

    await act(async () => {
      slow.resolve(json({ month: thisMonth(), projects: [exceeded] }))
      await refreshed
    })
    expect(result.current.banners).toEqual({ status: 'ready', projects: [exceeded] })
    expect(calls.filter((call) => call === 'GET /api/project-budgets')).toHaveLength(2)
  })

  it('refresh resolves with the fetched budgets', async () => {
    stubApi({ budgets: [reply([warning]), reply([exceeded])] })
    const { result } = renderHook(() => useProjectBudgets(0))
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    let data: unknown = null
    await act(async () => {
      data = await result.current.refresh()
    })
    expect(data).toEqual({ month: thisMonth(), projects: [exceeded] })
  })

  it('a failed refresh gives the error line and the unavailable section, and resolves null', async () => {
    stubApi({ budgets: [reply([warning]), () => json({ error: 'boom' }, 500)] })
    const { result } = renderHook(() => useProjectBudgets(0))
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    let data: unknown = 'unset'
    await act(async () => {
      data = await result.current.refresh()
    })
    expect(data).toBeNull()
    expect(result.current.banners).toEqual({ status: 'error', message: 'boom' })
    expect(result.current.section).toEqual({ status: 'error' })
  })

  it('a full reload hides the banners but keeps the rows until the response', async () => {
    const slow = deferred()
    stubApi({ budgets: [reply([warning]), () => slow.promise] })
    const { result, rerender } = renderHook(({ key }) => useProjectBudgets(key), {
      initialProps: { key: 0 },
    })
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    rerender({ key: 1 })
    expect(result.current.banners).toEqual({ status: 'loading' })
    expect(result.current.section).toEqual({
      status: 'ready',
      month: thisMonth(),
      projects: [warning],
    })

    await act(async () => {
      slow.resolve(json({ month: thisMonth(), projects: [exceeded] }))
    })
    await waitFor(() =>
      expect(result.current.banners).toEqual({ status: 'ready', projects: [exceeded] }),
    )
  })

  it('a failed full reload is handled like a failed first load', async () => {
    stubApi({ budgets: [reply([warning]), () => json({ error: 'boom' }, 500)] })
    const { result, rerender } = renderHook(({ key }) => useProjectBudgets(key), {
      initialProps: { key: 0 },
    })
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    rerender({ key: 1 })
    await waitFor(() => expect(result.current.banners.status).toBe('error'))
    expect(result.current.section).toEqual({ status: 'error' })
  })

  it('ignores the response of an older load once a newer one started', async () => {
    const older = deferred()
    stubApi({ budgets: [reply([warning]), () => older.promise, reply([exceeded])] })
    const { result } = renderHook(() => useProjectBudgets(0))
    await waitFor(() => expect(result.current.banners.status).toBe('ready'))

    let first: Promise<unknown> = Promise.resolve()
    act(() => {
      first = result.current.refresh()
    })
    await act(async () => {
      await result.current.refresh()
    })
    expect(result.current.banners).toEqual({ status: 'ready', projects: [exceeded] })

    let olderData: unknown = null
    await act(async () => {
      older.resolve(json({ month: thisMonth(), projects: [warning] }))
      olderData = await first
    })
    // The older answer does not replace the newer one on screen, but its caller still gets it.
    expect(result.current.banners).toEqual({ status: 'ready', projects: [exceeded] })
    expect(olderData).toEqual({ month: thisMonth(), projects: [warning] })
  })
})
