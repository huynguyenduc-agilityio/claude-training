import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProjectBudget, ProjectBudgets } from '../../shared/api.ts'
import { thisMonth } from '../../shared/format.ts'
import { budgetEntry, json, stubApi } from '../../test/fakeApi.ts'
import {
  ProjectBudgetsSection,
  type ProjectBudgetsSectionState,
} from './ProjectBudgetsSection.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
})

const codeReview = budgetEntry('code-review', 10, 8.12, 81, 'warning')
const docsSearch = budgetEntry('docs-search', null, 1.2, null, 'none')
const supportBot = budgetEntry('support-bot', null, 0, null, 'none')
const threeProjects = [codeReview, docsSearch, supportBot]

const dataFor = (projects: ProjectBudget[]): ProjectBudgets => ({ month: thisMonth(), projects })

/** Holds the section state like `useProjectBudgets` does, with a scripted `refresh`. */
const Harness = ({
  initial,
  month = thisMonth(),
  onRefresh,
}: {
  initial: ProjectBudgetsSectionState
  month?: string
  onRefresh: () => Promise<ProjectBudgets | null>
}) => {
  const [section, setSection] = useState(initial)
  const refresh = async () => {
    const data = await onRefresh()
    setSection(data ? { status: 'ready', ...data } : { status: 'error' })
    return data
  }
  return <ProjectBudgetsSection section={section} month={month} refresh={refresh} />
}

const ready = (projects: ProjectBudget[]): ProjectBudgetsSectionState => ({
  status: 'ready',
  month: thisMonth(),
  projects,
})

const row = (project: string) => within(screen.getByRole('form', { name: project }))
const field = (project: string) =>
  screen.getByLabelText(`Budget for ${project}`) as HTMLInputElement
const typeIn = (project: string, value: string) =>
  fireEvent.change(field(project), { target: { value } })
const button = (project: string, name: 'Save' | 'Remove') =>
  row(project).getByRole('button', { name }) as HTMLButtonElement
const save = (project: string) => fireEvent.click(button(project, 'Save'))
const remove = (project: string) => fireEvent.click(button(project, 'Remove'))

const noRefresh = () => vi.fn(async (): Promise<ProjectBudgets | null> => null)

const renderReady = (
  options: {
    projects?: ProjectBudget[]
    month?: string
    onRefresh?: () => Promise<ProjectBudgets | null>
  } = {},
) =>
  render(
    <Harness
      initial={ready(options.projects ?? threeProjects)}
      month={options.month}
      onRefresh={options.onRefresh ?? noRefresh()}
    />,
  )

describe('rendering', () => {
  it('lists one row per project in the API order with its spending and budget (F-01)', () => {
    renderReady()
    expect(screen.getByRole('heading', { name: 'Project budgets' })).not.toBeNull()
    const names = screen.getAllByRole('form').map((form) => form.getAttribute('aria-label'))
    expect(names).toEqual(['code-review', 'docs-search', 'support-bot'])

    expect(row('code-review').getByText('Spent this month: $8.12')).not.toBeNull()
    expect(field('code-review').value).toBe('10')
    expect(row('code-review').getByText('$10.00')).not.toBeNull()

    expect(field('docs-search').value).toBe('')
    expect(row('docs-search').getByText('No budget')).not.toBeNull()
    expect(field('support-bot').value).toBe('')
    expect(row('support-bot').getByText('No budget')).not.toBeNull()
  })

  it('shows the budget as the API returns it, for example 7.5 (F-01)', () => {
    renderReady({ projects: [budgetEntry('code-review', 7.5, 1, 13, 'ok')] })
    expect(field('code-review').value).toBe('7.5')
    expect(row('code-review').getByText('$7.50')).not.toBeNull()
  })

  it('offers Remove only when a budget is set (F-05)', () => {
    renderReady()
    expect(row('code-review').getByRole('button', { name: 'Remove' })).not.toBeNull()
    expect(row('docs-search').queryByRole('button', { name: 'Remove' })).toBeNull()
    expect(row('support-bot').queryByRole('button', { name: 'Remove' })).toBeNull()
  })

  it('has no field for a new project name (F-22)', () => {
    renderReady()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
  })

  it('has a number field without browser rules, so the API decides (F-06)', () => {
    renderReady()
    expect(field('code-review').type).toBe('number')
    expect(field('code-review').getAttribute('step')).toBe('any')
    expect(field('code-review').hasAttribute('min')).toBe(false)
    expect(screen.getByRole('form', { name: 'code-review' }).hasAttribute('novalidate')).toBe(true)
  })

  it('says which month the spending is for when another month is picked (F-12)', () => {
    renderReady({ month: '2020-01' })
    expect(screen.getByText(`Spending shown for ${thisMonth()}.`)).not.toBeNull()
    expect(row('code-review').getByText('Spent this month: $8.12')).not.toBeNull()
  })

  it('does not say it on the current month (F-13)', () => {
    renderReady({ month: thisMonth() })
    expect(screen.queryByText(/Spending shown for/)).toBeNull()
  })

  it('reads "No projects have usage records yet." for an empty list (F-14)', () => {
    renderReady({ projects: [] })
    expect(screen.getByText('No projects have usage records yet.')).not.toBeNull()
    expect(screen.queryAllByRole('form')).toHaveLength(0)
  })

  it('shows the empty text and no month sentence on a past month (F-24)', () => {
    renderReady({ projects: [], month: '2020-01' })
    expect(screen.getByText('No projects have usage records yet.')).not.toBeNull()
    expect(screen.queryByText(/Spending shown for/)).toBeNull()
  })

  it('reads "Project budgets are unavailable." when the budgets cannot load (F-15)', () => {
    render(<Harness initial={{ status: 'error' }} onRefresh={noRefresh()} />)
    const message = screen.getByText('Project budgets are unavailable.')
    expect(message.className).toBe('error')
    expect(message.getAttribute('role')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Project budgets' })).not.toBeNull()
  })

  it('reads "Loading project budgets…" on the first load (F-16)', () => {
    render(<Harness initial={{ status: 'loading' }} onRefresh={noRefresh()} />)
    expect(screen.getByText('Loading project budgets…')).not.toBeNull()
    expect(screen.queryAllByRole('form')).toHaveLength(0)
  })

  it('keeps typed text across a failed load and shows it again after the next one', () => {
    const refresh = noRefresh()
    const { rerender } = render(
      <ProjectBudgetsSection section={ready(threeProjects)} month={thisMonth()} refresh={refresh} />,
    )
    typeIn('docs-search', '33')

    rerender(<ProjectBudgetsSection section={{ status: 'error' }} month={thisMonth()} refresh={refresh} />)
    expect(screen.getByText('Project budgets are unavailable.')).not.toBeNull()

    rerender(
      <ProjectBudgetsSection section={ready(threeProjects)} month={thisMonth()} refresh={refresh} />,
    )
    expect(field('docs-search').value).toBe('33')
  })
})

describe('Save', () => {
  it('sets a budget: "Saved", the API value and the money format, then a reload (F-02)', async () => {
    const requests: unknown[] = []
    stubApi({
      budgets: [],
      mutation: ({ method, url, body }) => {
        requests.push({ method, url, body })
        return json(docsSearch)
      },
    })
    const onRefresh = vi.fn(async () =>
      dataFor([codeReview, budgetEntry('docs-search', 15, 1.2, 8, 'ok'), supportBot]),
    )
    renderReady({ onRefresh })

    typeIn('docs-search', '15')
    save('docs-search')

    await row('docs-search').findByText('Saved')
    await waitFor(() => expect(row('docs-search').getByText('$15.00')).not.toBeNull())
    expect(field('docs-search').value).toBe('15')
    expect(requests).toEqual([
      { method: 'PUT', url: '/api/project-budgets/docs-search', body: { budgetUsd: 15 } },
    ])
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(row('docs-search').getByRole('button', { name: 'Remove' })).not.toBeNull()
  })

  it('changes a budget (F-03)', async () => {
    stubApi({ budgets: [], mutation: () => json(codeReview) })
    renderReady({
      onRefresh: async () =>
        dataFor([budgetEntry('code-review', 7.5, 8.12, 108, 'exceeded'), docsSearch, supportBot]),
    })

    typeIn('code-review', '7.5')
    save('code-review')

    await row('code-review').findByText('Saved')
    await waitFor(() => expect(row('code-review').getByText('$7.50')).not.toBeNull())
    expect(field('code-review').value).toBe('7.5')
  })

  it('keeps the typed text until the reload answers, then shows the API value (F-17)', async () => {
    stubApi({ budgets: [], mutation: () => json(docsSearch) })
    let release: (data: ProjectBudgets | null) => void = () => {}
    renderReady({ onRefresh: () => new Promise((resolve) => (release = resolve)) })

    typeIn('docs-search', '15.0')
    save('docs-search')
    await row('docs-search').findByText('Saved')
    expect(field('docs-search').value).toBe('15.0')
    expect(row('docs-search').getByText('No budget')).not.toBeNull()

    release(dataFor([codeReview, budgetEntry('docs-search', 15, 1.2, 8, 'ok'), supportBot]))
    await waitFor(() => expect(field('docs-search').value).toBe('15'))
    expect(row('docs-search').getByText('$15.00')).not.toBeNull()
  })

  it('sends the same value again and shows "Saved" (F-19)', async () => {
    const bodies: unknown[] = []
    stubApi({
      budgets: [],
      mutation: ({ body }) => {
        bodies.push(body)
        return json(codeReview)
      },
    })
    renderReady({ onRefresh: async () => dataFor(threeProjects) })

    save('code-review')

    await row('code-review').findByText('Saved')
    expect(bodies).toEqual([{ budgetUsd: 10 }])
  })

  it.each([
    ['0', 0, 'budgetUsd must be greater than 0'],
    ['-5', -5, 'budgetUsd must be greater than 0'],
    ['10.005', 10.005, 'budgetUsd must have at most 2 decimals'],
    ['', null, 'budgetUsd must be a number'],
  ])(
    'shows the API error alone and keeps the typed text for "%s" (F-06)',
    async (typed, sent, error) => {
      const bodies: unknown[] = []
      stubApi({
        budgets: [],
        mutation: ({ body }) => {
          bodies.push(body)
          return json({ error }, 400)
        },
      })
      const onRefresh = noRefresh()
      renderReady({ onRefresh })

      typeIn('code-review', typed)
      save('code-review')

      const alert = await row('code-review').findByRole('alert')
      expect(alert.textContent).toBe(error)
      expect(field('code-review').value).toBe(typed)
      expect(bodies).toEqual([{ budgetUsd: sent }])
      expect(onRefresh).not.toHaveBeenCalled()
      expect(row('code-review').getByText('$10.00')).not.toBeNull()
      expect(row('docs-search').getByText('No budget')).not.toBeNull()
      expect(screen.queryAllByRole('alert')).toHaveLength(1)
    },
  )

  it('sends text the browser cannot read as a number as null (F-07)', async () => {
    const bodies: unknown[] = []
    stubApi({
      budgets: [],
      mutation: ({ body }) => {
        bodies.push(body)
        return json({ error: 'budgetUsd must be a number' }, 400)
      },
    })
    renderReady()

    typeIn('code-review', 'abc')
    expect(field('code-review').value).toBe('')
    save('code-review')

    const alert = await row('code-review').findByRole('alert')
    expect(alert.textContent).toBe('budgetUsd must be a number')
    expect(bodies).toEqual([{ budgetUsd: null }])
  })

  it('saves with Enter in the field', async () => {
    const bodies: unknown[] = []
    stubApi({
      budgets: [],
      mutation: ({ body }) => {
        bodies.push(body)
        return json(codeReview)
      },
    })
    renderReady({ onRefresh: async () => dataFor(threeProjects) })

    typeIn('code-review', '12')
    fireEvent.submit(screen.getByRole('form', { name: 'code-review' }))

    await row('code-review').findByText('Saved')
    expect(bodies).toEqual([{ budgetUsd: 12 }])
  })

  it('shows "Could not save: " plus the error when there is no response (F-08)', async () => {
    stubApi({
      budgets: [],
      mutation: () => {
        throw new TypeError('Failed to fetch')
      },
    })
    const onRefresh = noRefresh()
    renderReady({ onRefresh })

    typeIn('docs-search', '15')
    save('docs-search')

    const alert = await row('docs-search').findByRole('alert')
    expect(alert.textContent).toBe('Could not save: Failed to fetch')
    expect(field('docs-search').value).toBe('15')
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('prefixes a 500 answer (F-10)', async () => {
    stubApi({ budgets: [], mutation: () => json({ error: 'Internal server error' }, 500) })
    renderReady()

    typeIn('code-review', '12')
    save('code-review')

    const alert = await row('code-review').findByRole('alert')
    expect(alert.textContent).toBe('Could not save: Internal server error')
  })

  it('shows the fallback text alone for a 4xx without an error field (F-11)', async () => {
    stubApi({ budgets: [], mutation: () => json({}, 404) })
    renderReady()

    typeIn('code-review', '12')
    save('code-review')

    const alert = await row('code-review').findByRole('alert')
    expect(alert.textContent).toBe('Request failed: 404')
  })

  it('clears an error message when the field is edited (F-20)', async () => {
    stubApi({
      budgets: [],
      mutation: () => json({ error: 'budgetUsd must be greater than 0' }, 400),
    })
    renderReady()

    typeIn('code-review', '0')
    save('code-review')
    await row('code-review').findByRole('alert')

    typeIn('code-review', '1')
    expect(row('code-review').queryByRole('alert')).toBeNull()
    expect(field('code-review').value).toBe('1')
  })

  it('clears "Saved" when the field is edited (F-20)', async () => {
    stubApi({ budgets: [], mutation: () => json(codeReview) })
    renderReady({ onRefresh: async () => dataFor(threeProjects) })

    save('code-review')
    await row('code-review').findByText('Saved')
    typeIn('code-review', '11')
    expect(row('code-review').queryByText('Saved')).toBeNull()
  })

  it('leaves the other rows alone: typed text and message stay (F-17)', async () => {
    stubApi({
      budgets: [],
      mutation: ({ url }) =>
        url.endsWith('/docs-search')
          ? json({ error: 'budgetUsd must be greater than 0' }, 400)
          : json(codeReview),
    })
    renderReady({
      onRefresh: async () =>
        dataFor([budgetEntry('code-review', 15, 8.12, 54, 'ok'), docsSearch, supportBot]),
    })

    typeIn('docs-search', '0')
    save('docs-search')
    await row('docs-search').findByRole('alert')
    typeIn('support-bot', '33')

    typeIn('code-review', '15.0')
    save('code-review')
    await waitFor(() => expect(field('code-review').value).toBe('15'))

    expect(field('docs-search').value).toBe('0')
    expect(row('docs-search').getByRole('alert').textContent).toBe(
      'budgetUsd must be greater than 0',
    )
    expect(field('support-bot').value).toBe('33')
  })

  it('disables Save and Remove of that row while its request is pending (F-18)', async () => {
    let release: (response: Response) => void = () => {}
    stubApi({
      budgets: [],
      mutation: () => new Promise<Response>((resolve) => (release = resolve)),
    })
    renderReady({ onRefresh: async () => dataFor(threeProjects) })

    save('code-review')
    await waitFor(() => expect(button('code-review', 'Save').disabled).toBe(true))
    expect(button('code-review', 'Remove').disabled).toBe(true)
    // Only that row is pending.
    expect(button('docs-search', 'Save').disabled).toBe(false)

    release(json(codeReview))
    await row('code-review').findByText('Saved')
    expect(button('code-review', 'Save').disabled).toBe(false)
  })

  it('keeps text typed while the request is pending and ignores the answer for it', async () => {
    let release: (response: Response) => void = () => {}
    stubApi({
      budgets: [],
      mutation: () => new Promise<Response>((resolve) => (release = resolve)),
    })
    const onRefresh = vi.fn(async () =>
      dataFor([budgetEntry('code-review', 15, 8.12, 54, 'ok'), docsSearch, supportBot]),
    )
    renderReady({ onRefresh })

    typeIn('code-review', '15')
    save('code-review')
    await waitFor(() => expect(button('code-review', 'Save').disabled).toBe(true))
    typeIn('code-review', '20')

    release(json(codeReview))
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(row('code-review').getByText('$15.00')).not.toBeNull())
    expect(field('code-review').value).toBe('20')
    expect(row('code-review').queryByText('Saved')).toBeNull()
  })
})

describe('Remove', () => {
  it('removes a budget: "No budget", an empty field, no message (F-04)', async () => {
    const calls: unknown[] = []
    stubApi({
      budgets: [],
      mutation: ({ method, url }) => {
        calls.push({ method, url })
        return new Response(null, { status: 204 })
      },
    })
    const onRefresh = vi.fn(async () =>
      dataFor([budgetEntry('code-review', null, 8.12, null, 'none'), docsSearch, supportBot]),
    )
    renderReady({ onRefresh })

    remove('code-review')

    await waitFor(() => expect(row('code-review').getByText('No budget')).not.toBeNull())
    expect(field('code-review').value).toBe('')
    expect(row('code-review').queryByText('Saved')).toBeNull()
    expect(row('code-review').queryByRole('alert')).toBeNull()
    expect(row('code-review').queryByRole('button', { name: 'Remove' })).toBeNull()
    expect(calls).toEqual([{ method: 'DELETE', url: '/api/project-budgets/code-review' }])
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('resets typed text to the empty budget after a Remove', async () => {
    stubApi({ budgets: [], mutation: () => new Response(null, { status: 204 }) })
    renderReady({
      onRefresh: async () =>
        dataFor([budgetEntry('code-review', null, 8.12, null, 'none'), docsSearch, supportBot]),
    })

    typeIn('code-review', '7')
    remove('code-review')

    await waitFor(() => expect(field('code-review').value).toBe(''))
  })

  it('shows "Could not remove: " plus the error and keeps the budget (F-09)', async () => {
    stubApi({
      budgets: [],
      mutation: () => {
        throw new TypeError('Failed to fetch')
      },
    })
    const onRefresh = noRefresh()
    renderReady({ onRefresh })

    remove('code-review')

    const alert = await row('code-review').findByRole('alert')
    expect(alert.textContent).toBe('Could not remove: Failed to fetch')
    expect(field('code-review').value).toBe('10')
    expect(row('code-review').getByText('$10.00')).not.toBeNull()
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('shows a 4xx answer alone', async () => {
    stubApi({ budgets: [], mutation: () => json({ error: 'project not found' }, 404) })
    renderReady()

    remove('code-review')

    const alert = await row('code-review').findByRole('alert')
    expect(alert.textContent).toBe('project not found')
  })
})
