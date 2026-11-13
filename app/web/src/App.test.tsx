import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { budgetEntry, json, stubApi, summaryFor } from './test/fakeApi.ts'
import { thisMonth } from './shared/format.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const alertTexts = () => screen.queryAllByRole('alert').map((node) => node.textContent ?? '')

const ready = async () => {
  await screen.findByText('By model')
}

const addRecord = async () => {
  const form = document.querySelector('form') as HTMLFormElement
  fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'code-review' } })
  fireEvent.change(screen.getByLabelText('Input tokens'), { target: { value: '100' } })
  fireEvent.change(screen.getByLabelText('Output tokens'), { target: { value: '50' } })
  fireEvent.submit(form)
}

const warning = budgetEntry('code-review', 10, 8.12, 81, 'warning')
const exceeded = budgetEntry('code-review', 10, 12.5, 125, 'exceeded')

describe('App project budget banners', () => {
  it('shows the company banner, then project banners, then the unpriced banner (B-06)', async () => {
    stubApi({
      budgets: [() => json({ month: thisMonth(), projects: [exceeded] })],
      summary: (month) =>
        json(
          summaryFor(month, {
            unpricedCount: 2,
            budget: { spent: 90, budget: 100, ratio: 0.9, level: 'warning' },
          }),
        ),
    })
    render(<App />)
    await ready()
    await waitFor(() => expect(alertTexts()).toHaveLength(3))
    const texts = alertTexts()
    expect(texts[0]).toBe('Budget warning: $90.00 of $100.00 spent this month (90%).')
    expect(texts[1]).toBe(
      'Budget exceeded for code-review: $12.50 of $10.00 spent this month (125%).',
    )
    expect(texts[2]).toBe('2 records have no price and are not included in the totals.')
  })

  it('shows no project banner and no error line on a past month (B-07)', async () => {
    stubApi({ budgets: [() => json({ month: thisMonth(), projects: [exceeded] })] })
    const { container } = render(<App />)
    await ready()
    await waitFor(() => expect(alertTexts().some((t) => t.includes('code-review'))).toBe(true))

    fireEvent.change(container.querySelector('input[type="month"]') as HTMLInputElement, {
      target: { value: '2020-01' },
    })
    await waitFor(() => expect(screen.getByText('By model')).not.toBeNull())
    expect(alertTexts().some((text) => text.includes('code-review'))).toBe(false)
  })

  it('shows no budgets error line on a past month when the request failed (B-07)', async () => {
    stubApi({ budgets: [() => json({ error: 'boom' }, 500)] })
    const { container } = render(<App />)
    await screen.findByText('Could not load project budgets: boom')

    fireEvent.change(container.querySelector('input[type="month"]') as HTMLInputElement, {
      target: { value: '2020-01' },
    })
    await waitFor(() => expect(screen.getByText('By model')).not.toBeNull())
    expect(screen.queryByText(/Could not load project budgets/)).toBeNull()
  })

  it('shows the warning banner after a record is added, without a page reload (B-08)', async () => {
    const calls = stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [budgetEntry('code-review', 10, 7.9, 79, 'ok')] }),
        () => json({ month: thisMonth(), projects: [warning] }),
      ],
    })
    render(<App />)
    await ready()
    expect(alertTexts().some((text) => text.includes('code-review'))).toBe(false)

    await addRecord()
    await screen.findByText(
      'Budget warning for code-review: $8.12 of $10.00 spent this month (81%).',
    )
    expect(calls.filter((call) => call === 'GET /api/project-budgets')).toHaveLength(2)
  })

  it('shows one error line and the rest of the page when the budgets fail (B-09)', async () => {
    stubApi({
      budgets: [() => json({ error: 'Internal server error' }, 500)],
      summary: (month) =>
        json(summaryFor(month, { budget: { spent: 90, budget: 100, ratio: 0.9, level: 'warning' } })),
    })
    render(<App />)
    await screen.findByText('Could not load project budgets: Internal server error')
    expect(screen.getByText('By model')).not.toBeNull()
    expect(screen.getByText('By project')).not.toBeNull()
    // The company-wide banner stays; no project banner shows.
    expect(alertTexts()).toEqual(['Budget warning: $90.00 of $100.00 spent this month (90%).'])
  })

  it('shows nothing in the banner area while the budgets are slow (B-10)', async () => {
    let release: (response: Response) => void = () => {}
    stubApi({
      budgets: [() => new Promise<Response>((resolve) => (release = resolve))],
    })
    render(<App />)
    await ready()
    expect(screen.queryByText(/Could not load project budgets/)).toBeNull()
    expect(alertTexts().some((text) => text.includes('for code-review'))).toBe(false)

    release(json({ month: thisMonth(), projects: [warning] }))
    await screen.findByText(/Budget warning for code-review/)
  })

  it('treats a failed reload after a record is added like a failed first load (B-12)', async () => {
    stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [warning] }),
        () => json({ error: 'Internal server error' }, 500),
      ],
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    await addRecord()
    await screen.findByText('Could not load project budgets: Internal server error')
    expect(screen.queryByText(/Budget warning for code-review/)).toBeNull()
    expect(screen.getByText('By model')).not.toBeNull()
  })

  it('shows neither banners nor the budgets error line when the summary fails (B-13)', async () => {
    stubApi({
      budgets: [() => json({ error: 'boom' }, 500)],
      summary: () => json({ error: 'summary down' }, 500),
    })
    render(<App />)
    await screen.findByText('Could not load data: summary down')
    expect(screen.queryByText(/Could not load project budgets/)).toBeNull()
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('hides the banners while the month reloads and brings them back after both loads (B-15)', async () => {
    let releaseBudgets: (response: Response) => void = () => {}
    let releaseSummary: () => void = () => {}
    let summaryCalls = 0
    stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [warning] }),
        () => new Promise<Response>((resolve) => (releaseBudgets = resolve)),
      ],
      summary: (month) => {
        summaryCalls += 1
        if (summaryCalls === 1) return json(summaryFor(month))
        return new Promise<Response>((resolve) => {
          releaseSummary = () => resolve(json(summaryFor(month)))
        })
      },
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    await addRecord()
    await screen.findByText('Loading…')
    expect(screen.queryByText(/Budget warning for code-review/)).toBeNull()

    // The month's data is back, the budgets are not: the area stays empty, no stale banner.
    releaseSummary()
    await ready()
    expect(screen.queryByText(/Budget warning for code-review/)).toBeNull()
    expect(screen.queryByText(/Could not load project budgets/)).toBeNull()

    releaseBudgets(json({ month: thisMonth(), projects: [exceeded] }))
    await screen.findByText(/Budget exceeded for code-review/)
  })

  it('does not fetch the budgets again when the month changes', async () => {
    const calls = stubApi({
      budgets: [() => json({ month: thisMonth(), projects: [warning] })],
    })
    const { container } = render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    fireEvent.change(container.querySelector('input[type="month"]') as HTMLInputElement, {
      target: { value: '2020-01' },
    })
    await waitFor(() => expect(calls.some((call) => call.includes('month=2020-01'))).toBe(true))
    expect(calls.filter((call) => call === 'GET /api/project-budgets')).toHaveLength(1)
  })
})
