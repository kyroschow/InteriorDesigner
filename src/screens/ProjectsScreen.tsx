import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FolderOpen, Loader2 } from 'lucide-react'
import { ApiError, api } from '@/api/client'
import { Brand } from '@/components/Brand'
import { useRecentProjectsStore } from '@/store/recentProjectsStore'
import type { Project } from '@/types/interior'

/** "My Projects" — projects opened on this device, each refreshed from the server. */
export function ProjectsScreen() {
  const navigate = useNavigate()
  const recent = useRecentProjectsStore((s) => s.projects)
  const forget = useRecentProjectsStore((s) => s.forget)
  const [loaded, setLoaded] = useState<Record<string, Project | 'error'>>({})

  useEffect(() => {
    let cancelled = false
    for (const { id } of recent) {
      api.getProject(id).then(
        (project) => !cancelled && setLoaded((prev) => ({ ...prev, [id]: project })),
        (err) => {
          if (cancelled) return
          if (err instanceof ApiError && err.status === 404) forget(id)
          else setLoaded((prev) => ({ ...prev, [id]: 'error' }))
        },
      )
    }
    return () => {
      cancelled = true
    }
  }, [recent.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="animate-pane-in mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Brand size="sm" />
      {recent.length === 0 ? (
        <div className="panel flex w-full flex-col items-center gap-4 rounded-panel p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-ink-soft">
            <FolderOpen size={24} />
          </div>
          <h1 className="serif text-2xl text-ink">No projects yet</h1>
          <p className="text-sm text-ink-soft/70">Projects you create or open on this device show up here.</p>
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="mt-2 inline-flex items-center gap-2 rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
          >
            New Project
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="w-full space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h1 className="serif text-2xl text-ink">My projects</h1>
            <button type="button" onClick={() => navigate('/new')} className="inline-flex items-center gap-1.5 rounded-control bg-ink px-3 py-2 text-sm font-semibold text-app">
              New
              <ArrowRight size={14} />
            </button>
          </div>
          {recent.map((entry) => {
            const project = loaded[entry.id]
            const furnished = project && project !== 'error' ? project.roomStatuses.filter((s) => s.status === 'furnished').length : 0
            const stale = project && project !== 'error' ? project.roomStatuses.filter((s) => s.status === 'stale').length : 0
            return (
              <Link key={entry.id} to={`/projects/${entry.id}`} className="panel flex items-center justify-between gap-3 rounded-card p-4 transition-transform hover:-translate-y-0.5">
                <div className="min-w-0">
                  <div className="serif truncate text-base text-ink">{project && project !== 'error' ? project.name : entry.name}</div>
                  <div className="text-xs text-ink-soft/60">
                    {project === undefined ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Checking…
                      </span>
                    ) : project === 'error' ? (
                      "Couldn't refresh"
                    ) : (
                      `Updated ${new Date(project.updatedAt).toLocaleString()} · ${furnished} of ${project.roomStatuses.length} rooms furnished${stale ? ` · ${stale} stale` : ''}`
                    )}
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-soft/50" />
              </Link>
            )
          })}
        </div>
      )}
      <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-control px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas">
        <ArrowLeft size={16} />
        Back home
      </button>
    </div>
  )
}
