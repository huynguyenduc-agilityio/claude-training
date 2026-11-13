import { useEffect, useState } from 'react'
import { fetchProjectBudgets } from '../../shared/api.ts'
import type { ProjectBudgetsState } from './ProjectBudgetBanners.tsx'

/**
 * Loads `GET /api/project-budgets` on its own, outside the month's `Promise.all`, so a failure here
 * does not stop the rest of the page. The API is current-month only, so the month is not a
 * dependency. Every run starts from `loading`, so no old banner shows next to new month data.
 */
export const useProjectBudgets = (reloadKey: number): ProjectBudgetsState => {
  const [state, setState] = useState<ProjectBudgetsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetchProjectBudgets()
      .then((budgets) => {
        if (!cancelled) setState({ status: 'ready', projects: budgets.projects })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return state
}
