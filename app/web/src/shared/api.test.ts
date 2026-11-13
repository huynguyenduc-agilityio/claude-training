import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, deleteProjectBudget, fetchSummary, saveProjectBudget } from './api.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const respond = (response: Response) => {
  const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const failure = async (run: () => Promise<unknown>): Promise<ApiError> => {
  try {
    await run()
  } catch (error) {
    return error as ApiError
  }
  throw new Error('expected a failure')
}

describe('readJson errors', () => {
  it('keeps the API error text and carries the status (4xx)', async () => {
    respond(jsonResponse({ error: 'budgetUsd must be greater than 0' }, 400))
    const error = await failure(() => saveProjectBudget('code-review', 0))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('budgetUsd must be greater than 0')
    expect(error.status).toBe(400)
  })

  it('falls back to "Request failed: <status>" without an error field', async () => {
    respond(jsonResponse({}, 404))
    const error = await failure(() => fetchSummary('2026-11'))
    expect(error.message).toBe('Request failed: 404')
    expect(error.status).toBe(404)
  })

  it('carries the status of a 5xx answer', async () => {
    respond(jsonResponse({ error: 'Internal server error' }, 500))
    const error = await failure(() => saveProjectBudget('code-review', 5))
    expect(error.message).toBe('Internal server error')
    expect(error.status).toBe(500)
  })
})

describe('saveProjectBudget', () => {
  it('PUTs the amount to the encoded project path', async () => {
    const fetchMock = respond(jsonResponse({ project: 'search, v2' }, 200))
    await saveProjectBudget('search, v2', 15)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/project-budgets/search%2C%20v2')
    expect(init?.method).toBe('PUT')
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init?.body as string)).toEqual({ budgetUsd: 15 })
  })

  it('sends null as null, not 0', async () => {
    const fetchMock = respond(jsonResponse({}, 200))
    await saveProjectBudget('code-review', null)
    const [, init] = fetchMock.mock.calls[0]!
    expect(init?.body).toBe('{"budgetUsd":null}')
  })
})

describe('deleteProjectBudget', () => {
  it('DELETEs the encoded path and accepts 204 with no body', async () => {
    const fetchMock = respond(new Response(null, { status: 204 }))
    await expect(deleteProjectBudget('say "hi"')).resolves.toBeUndefined()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/project-budgets/say%20%22hi%22')
    expect(init?.method).toBe('DELETE')
  })

  it('throws an ApiError with the status on a failed answer', async () => {
    respond(jsonResponse({ error: 'project not found' }, 404))
    const error = await failure(() => deleteProjectBudget('new-team'))
    expect(error.message).toBe('project not found')
    expect(error.status).toBe(404)
  })
})
