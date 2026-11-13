import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

const budgetRow = (project: string) => within(screen.getByRole('form', { name: project }))
const budgetField = (project: string) =>
  screen.getByLabelText(`Budget for ${project}`) as HTMLInputElement
const slow = () => {
  let release: (response: Response) => void = () => {}
  const promise = new Promise<Response>((resolve) => (release = resolve))
  return { promise, release: (response: Response) => release(response) }
}

describe('App project budgets form', () => {
  it('puts the section below the Add record form and above the banners (EXP-114)', async () => {
    stubApi({ budgets: [() => json({ month: thisMonth(), projects: [warning] })] })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    const html = document.body.innerHTML
    const add = html.indexOf('Add usage record')
    const section = html.indexOf('Project budgets')
    const banner = html.indexOf('Budget warning for code-review')
    expect(add).toBeGreaterThan(-1)
    expect(section).toBeGreaterThan(add)
    expect(banner).toBeGreaterThan(section)
  })

  it('reloads only the budgets after Save, and the banners follow (F-02)', async () => {
    const requests: string[] = []
    const calls = stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [warning] }),
        () =>
          json({
            month: thisMonth(),
            projects: [budgetEntry('code-review', 7.5, 8.12, 108, 'exceeded')],
          }),
      ],
      mutation: ({ method, url, body }) => {
        requests.push(`${method} ${url} ${JSON.stringify(body)}`)
        return json(warning)
      },
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)
    const before = calls.length

    fireEvent.change(budgetField('code-review'), { target: { value: '7.5' } })
    fireEvent.click(budgetRow('code-review').getByRole('button', { name: 'Save' }))

    await screen.findByText(/Budget exceeded for code-review: \$8\.12 of \$7\.50/)
    await waitFor(() => expect(budgetRow('code-review').getByText('$7.50')).not.toBeNull())
    expect(budgetRow('code-review').getByText('Saved')).not.toBeNull()
    expect(requests).toEqual(['PUT /api/project-budgets/code-review {"budgetUsd":7.5}'])
    expect(calls.slice(before)).toEqual([
      'PUT /api/project-budgets/code-review',
      'GET /api/project-budgets',
    ])
  })

  it('reloads only the budgets after Remove, and the banner goes (F-04)', async () => {
    const calls = stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [warning] }),
        () => json({ month: thisMonth(), projects: [budgetEntry('code-review', null, 8.12, null, 'none')] }),
      ],
      mutation: () => new Response(null, { status: 204 }),
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)
    const before = calls.length

    fireEvent.click(budgetRow('code-review').getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(screen.queryByText(/Budget warning for code-review/)).toBeNull())
    expect(budgetRow('code-review').getByText('No budget')).not.toBeNull()
    expect(budgetField('code-review').value).toBe('')
    expect(calls.slice(before)).toEqual([
      'DELETE /api/project-budgets/code-review',
      'GET /api/project-budgets',
    ])
  })

  it('keeps the old banners until the slow budgets reload answers (B-11)', async () => {
    const reload = slow()
    stubApi({
      budgets: [() => json({ month: thisMonth(), projects: [warning] }), () => reload.promise],
      mutation: () => json(warning),
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    fireEvent.change(budgetField('code-review'), { target: { value: '15' } })
    fireEvent.click(budgetRow('code-review').getByRole('button', { name: 'Save' }))
    await budgetRow('code-review').findByText('Saved')

    // The reload is still in flight: the banner and the row keep what they showed.
    expect(screen.getByText(/Budget warning for code-review: \$8\.12 of \$10\.00/)).not.toBeNull()
    expect(budgetRow('code-review').getByText('$10.00')).not.toBeNull()
    expect(screen.queryByText('Loading…')).toBeNull()

    reload.release(
      json({ month: thisMonth(), projects: [budgetEntry('code-review', 15, 8.12, 54, 'ok')] }),
    )
    await waitFor(() => expect(screen.queryByText(/Budget warning for code-review/)).toBeNull())
    expect(budgetRow('code-review').getByText('$15.00')).not.toBeNull()
    expect(budgetField('code-review').value).toBe('15')
  })

  it('keeps the section and typed text while a usage record is added (F-21)', async () => {
    const reload = slow()
    const calls = stubApi({
      budgets: [
        () =>
          json({
            month: thisMonth(),
            projects: [warning, budgetEntry('docs-search', null, 1.2, null, 'none')],
          }),
        () => reload.promise,
      ],
    })
    render(<App />)
    await ready()
    await screen.findByLabelText('Budget for docs-search')

    fireEvent.change(budgetField('docs-search'), { target: { value: '33' } })
    await addRecord()
    await waitFor(() =>
      expect(calls.filter((call) => call === 'GET /api/project-budgets')).toHaveLength(2),
    )

    // The budgets are reloading: the section still shows its rows and the typed text.
    expect(budgetField('docs-search').value).toBe('33')
    expect(budgetRow('code-review').getByText('$10.00')).not.toBeNull()

    reload.release(
      json({
        month: thisMonth(),
        projects: [warning, budgetEntry('docs-search', null, 1.5, null, 'none')],
      }),
    )
    await waitFor(() =>
      expect(budgetRow('docs-search').getByText('Spent this month: $1.50')).not.toBeNull(),
    )
    expect(budgetField('docs-search').value).toBe('33')
  })

  it('does not change the company banner when a budget is saved (F-23)', async () => {
    stubApi({
      budgets: [
        () => json({ month: thisMonth(), projects: [warning] }),
        () => json({ month: thisMonth(), projects: [exceeded] }),
      ],
      mutation: () => json(warning),
      summary: (month) =>
        json(summaryFor(month, { budget: { spent: 90, budget: 100, ratio: 0.9, level: 'warning' } })),
    })
    render(<App />)
    await screen.findByText(/Budget warning for code-review/)

    fireEvent.click(budgetRow('code-review').getByRole('button', { name: 'Save' }))
    await screen.findByText(/Budget exceeded for code-review/)

    expect(alertTexts()[0]).toBe('Budget warning: $90.00 of $100.00 spent this month (90%).')
  })

  it('says which month the spending is for after another month is picked (F-12)', async () => {
    stubApi({ budgets: [() => json({ month: thisMonth(), projects: [warning] })] })
    const { container } = render(<App />)
    await screen.findByLabelText('Budget for code-review')
    expect(screen.queryByText(/Spending shown for/)).toBeNull()

    fireEvent.change(container.querySelector('input[type="month"]') as HTMLInputElement, {
      target: { value: '2020-01' },
    })
    await screen.findByText(`Spending shown for ${thisMonth()}.`)
    expect(budgetRow('code-review').getByText('Spent this month: $8.12')).not.toBeNull()
  })

  it('shows "Loading project budgets…" until the first answer (F-16)', async () => {
    const first = slow()
    stubApi({ budgets: [() => first.promise] })
    render(<App />)
    await ready()
    expect(screen.getByText('Loading project budgets…')).not.toBeNull()

    first.release(json({ month: thisMonth(), projects: [warning] }))
    await screen.findByLabelText('Budget for code-review')
    expect(screen.queryByText('Loading project budgets…')).toBeNull()
  })

  it('reads "Project budgets are unavailable." and still loads the page (F-15)', async () => {
    stubApi({ budgets: [() => json({ error: 'boom' }, 500)] })
    render(<App />)
    await screen.findByText('Project budgets are unavailable.')
    await screen.findByText('Could not load project budgets: boom')
    expect(screen.getByText('By model')).not.toBeNull()
  })

  it('keeps the section when the month data fails to load', async () => {
    stubApi({
      budgets: [() => json({ month: thisMonth(), projects: [warning] })],
      summary: () => json({ error: 'summary down' }, 500),
    })
    render(<App />)
    await screen.findByText('Could not load data: summary down')
    await screen.findByLabelText('Budget for code-review')
  })
})
