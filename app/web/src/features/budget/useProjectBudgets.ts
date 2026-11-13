import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProjectBudgets, type ProjectBudgets } from '../../shared/api.ts'
import type { ProjectBudgetsState } from './ProjectBudgetBanners.tsx'
import type { ProjectBudgetsSectionState } from './ProjectBudgetsSection.tsx'

export interface ProjectBudgetsHandle {
  /** For the banners: goes back to `loading` on every full reload, but not on `refresh`. */
  banners: ProjectBudgetsState
  /** For the form: keeps its rows while a reload is in flight; only a response changes it. */
  section: ProjectBudgetsSectionState
  /** Reloads only `GET /api/project-budgets`. Resolves with the response, or `null` on failure. */
  refresh: () => Promise<ProjectBudgets | null>
}

/**
 * Loads `GET /api/project-budgets` on its own, outside the month's `Promise.all`, so a failure here
 * does not stop the rest of the page. The API is current-month only, so the month is not a
 * dependency. A full reload (`reloadKey` changed) hides the banners until the answer, so no old banner
 * shows next to new month data; `refresh` keeps them, so a Save or Remove does not blink them.
 */
export const useProjectBudgets = (reloadKey: number): ProjectBudgetsHandle => {
  const [banners, setBanners] = useState<ProjectBudgetsState>({ status: 'loading' })
  const [section, setSection] = useState<ProjectBudgetsSectionState>({ status: 'loading' })
  const latest = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async (): Promise<ProjectBudgets | null> => {
    latest.current += 1
    const id = latest.current
    const current = () => mounted.current && latest.current === id
    try {
      const budgets = await fetchProjectBudgets()
      if (current()) {
        setBanners({ status: 'ready', projects: budgets.projects })
        setSection({ status: 'ready', month: budgets.month, projects: budgets.projects })
      }
      return budgets
    } catch (error) {
      if (current()) {
        setBanners({ status: 'error', message: error instanceof Error ? error.message : 'Request failed' })
        setSection({ status: 'error' })
      }
      return null
    }
  }, [])

  useEffect(() => {
    setBanners({ status: 'loading' })
    void load()
    return () => {
      // A newer load or an unmount makes this one stale.
      latest.current += 1
    }
  }, [reloadKey, load])

  return { banners, section, refresh: load }
}
