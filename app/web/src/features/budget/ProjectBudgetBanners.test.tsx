import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { budgetEntry } from '../../test/fakeApi.ts'
import { ProjectBudgetBanners } from './ProjectBudgetBanners.tsx'

describe('ProjectBudgetBanners', () => {
  it('shows a warning banner for a project at 80% or more (B-01)', () => {
    render(
      <ProjectBudgetBanners
        state={{ status: 'ready', projects: [budgetEntry('code-review', 10, 8.12, 81, 'warning')] }}
      />,
    )
    const banner = screen.getByRole('alert')
    expect(banner.textContent).toBe(
      'Budget warning for code-review: $8.12 of $10.00 spent this month (81%).',
    )
    expect(banner.className).toBe('banner banner-warning')
  })

  it('shows an exceeded banner for a project at 100% or more (B-02)', () => {
    render(
      <ProjectBudgetBanners
        state={{ status: 'ready', projects: [budgetEntry('code-review', 10, 12.5, 125, 'exceeded')] }}
      />,
    )
    const banner = screen.getByRole('alert')
    expect(banner.textContent).toBe(
      'Budget exceeded for code-review: $12.50 of $10.00 spent this month (125%).',
    )
    expect(banner.className).toBe('banner banner-exceeded')
  })

  it('shows no banner for ok or no-budget projects (B-03)', () => {
    const { container } = render(
      <ProjectBudgetBanners
        state={{
          status: 'ready',
          projects: [
            budgetEntry('support-bot', 10, 5, 50, 'ok'),
            budgetEntry('docs-search', null, 1.2, null, 'none'),
          ],
        }}
      />,
    )
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(container.textContent).toBe('')
  })

  it('shows the API percent, not one computed from ratio (B-14)', () => {
    render(
      <ProjectBudgetBanners
        state={{
          status: 'ready',
          projects: [{ ...budgetEntry('code-review', 10, 8.19, 81, 'warning'), ratio: 0.8199 }],
        }}
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('(81%)')
  })

  it('renders banners in the order exceeded first, higher share first', () => {
    render(
      <ProjectBudgetBanners
        state={{
          status: 'ready',
          projects: [
            budgetEntry('a', 10, 8.5, 85, 'warning'),
            budgetEntry('b', 10, 13, 130, 'exceeded'),
            budgetEntry('c', 10, 11, 110, 'exceeded'),
          ],
        }}
      />,
    )
    const texts = screen.getAllByRole('alert').map((banner) => banner.textContent)
    expect(texts[0]).toContain('for b:')
    expect(texts[1]).toContain('for c:')
    expect(texts[2]).toContain('for a:')
  })

  it('shows one error line when the budgets could not load (B-09)', () => {
    const { container } = render(
      <ProjectBudgetBanners state={{ status: 'error', message: 'Request failed: 500' }} />,
    )
    const line = container.querySelector('p.error')
    expect(line?.textContent).toBe('Could not load project budgets: Request failed: 500')
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('shows nothing while the budgets load for the first time (B-10)', () => {
    const { container } = render(<ProjectBudgetBanners state={{ status: 'loading' }} />)
    expect(container.textContent).toBe('')
  })
})
