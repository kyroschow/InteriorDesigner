import { useCallback, useEffect, useState } from 'react'
import { ApiError, api, isAbort } from '@/api/client'
import { useRecentProjectsStore } from '@/store/recentProjectsStore'
import type { FurnitureResponse, Layout, Project, RulesResponse } from '@/types/interior'

export type ProjectLoad =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; project: Project; catalog: FurnitureResponse; rules: RulesResponse }

/**
 * Server-owned project data for the workspace: the project (refresh/deep-link
 * safe), the catalog and safety rules, and the active layout whenever the
 * project points at one.
 */
export function useProjectData(projectId: string) {
  const [load, setLoad] = useState<ProjectLoad>({ status: 'loading' })
  const [activeLayout, setActiveLayout] = useState<Layout | null>(null)
  const [attempt, setAttempt] = useState(0)
  const remember = useRecentProjectsStore((s) => s.remember)
  const forget = useRecentProjectsStore((s) => s.forget)

  useEffect(() => {
    const controller = new AbortController()
    setLoad({ status: 'loading' })
    Promise.all([api.getProject(projectId, controller.signal), api.getFurniture({}, controller.signal), api.getRules(controller.signal)])
      .then(([project, catalog, rules]) => {
        setLoad({ status: 'ready', project, catalog, rules })
        remember(project)
      })
      .catch((error) => {
        if (isAbort(error)) return
        setLoad({ status: 'error', error })
        if (error instanceof ApiError && error.status === 404) forget(projectId)
      })
    return () => controller.abort()
  }, [projectId, attempt, remember, forget])

  const applyProject = useCallback(
    (project: Project) => {
      setLoad((prev) => (prev.status === 'ready' ? { ...prev, project } : prev))
      remember(project)
    },
    [remember],
  )

  const reload = useCallback(async () => {
    const project = await api.getProject(projectId)
    applyProject(project)
    return project
  }, [projectId, applyProject])

  const layoutId = load.status === 'ready' ? load.project.activeLayoutId : null
  useEffect(() => {
    if (!layoutId) {
      setActiveLayout(null)
      return
    }
    const controller = new AbortController()
    // Layouts are immutable, so a matching id never needs refetching.
    setActiveLayout((current) => (current?.id === layoutId ? current : null))
    api
      .getLayout(projectId, layoutId, controller.signal)
      .then(setActiveLayout)
      .catch((error) => {
        if (!isAbort(error)) setActiveLayout(null)
      })
    return () => controller.abort()
  }, [projectId, layoutId])

  return { load, activeLayout, applyProject, reload, retry: () => setAttempt((n) => n + 1) }
}
