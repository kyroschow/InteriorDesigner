import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { api, isAbort } from '@/api/client'
import { Brand } from '@/components/Brand'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { downloadSvgAsPng } from '@/lib/exportSvg'
import { sceneFurniture, sceneToPlan } from '@/lib/sceneCoordinates'
import { formatUsd } from '@/lib/units'
import type { Layout, Project } from '@/types/interior'

/**
 * `/projects/:projectId/preview?layoutId=&roomId=` — whole-home or single-room
 * view of one immutable layout. The room view filters the same snapshot, so
 * placements and rotations are identical in both.
 */
export function PreviewScreen() {
  const { projectId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const svgRef = useRef<SVGSVGElement>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [showFurniture, setShowFurniture] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  const layoutParam = params.get('layoutId')
  const roomId = params.get('roomId')

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    api
      .getProject(projectId, controller.signal)
      .then(async (p) => {
        setProject(p)
        const id = layoutParam ?? p.activeLayoutId
        setLayout(id ? await api.getLayout(projectId, id, controller.signal) : null)
      })
      .catch((err) => !isAbort(err) && setError(err))
    return () => controller.abort()
  }, [projectId, layoutParam])

  const scene = layout ?? project
  const plan = useMemo(() => (scene && project ? sceneToPlan(scene, project.name) : null), [scene, project])
  const furniture = useMemo(() => (layout ? sceneFurniture(layout) : undefined), [layout])

  const setRoom = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('roomId', id)
    else next.delete('roomId')
    setParams(next, { replace: true })
  }

  if (error) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 px-6">
        <ErrorBanner error={error} className="w-full" />
        <Link to="/projects" className="text-sm font-semibold text-accent-deep">
          My projects
        </Link>
      </div>
    )
  }
  if (!project || !plan) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" />
        Loading preview…
      </div>
    )
  }

  const rooms = (layout ?? project).floor.rooms
  const focusRoom = rooms.find((r) => r.id === roomId)
  const roomItems = focusRoom && layout ? layout.lines.filter((l) => l.roomId === focusRoom.id) : []
  const staleRooms = project.roomStatuses.filter((s) => s.status === 'stale')

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-canvas-line px-6 py-3">
        <Link to={`/projects/${project.id}/export`} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-semibold text-ink-soft hover:bg-canvas">
          <ArrowLeft size={16} />
          Back
        </Link>
        <Brand size="sm" />
        <span className="min-w-0 truncate text-sm text-ink-soft/70">{project.name}</span>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-ink-soft">
          <label className="flex items-center gap-1.5">
            View
            <select value={roomId ?? ''} onChange={(e) => setRoom(e.target.value)} className="rounded-control border border-canvas-line bg-app px-2 py-1 text-xs text-ink">
              <option value="">Whole home</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showFurniture} disabled={!layout} onChange={(e) => setShowFurniture(e.target.checked)} />
            Furniture
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            Labels
          </label>
          <button
            type="button"
            onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, `${project.name.replace(/[^\w-]+/g, '-').toLowerCase()}${focusRoom ? `-${focusRoom.label.toLowerCase()}` : ''}.png`)}
            className="inline-flex items-center gap-1.5 rounded-control bg-ink px-3 py-1.5 font-semibold text-app"
          >
            <Download size={13} />
            PNG
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-4xl">
            <FloorPlanSvg
              ref={svgRef}
              plan={plan}
              unitSystem={project.unitSystem}
              furniture={showFurniture ? furniture : undefined}
              showLabels={showLabels}
              focusRoomId={focusRoom?.id ?? null}
              onSelectRoom={(id) => setRoom(id === roomId ? '' : id)}
            />
          </div>
        </main>
        <aside className="shrink-0 space-y-2 border-canvas-line p-4 text-xs text-ink-soft lg:w-72 lg:border-l">
          {!layout && <p>Configured — awaiting generation. Showing rooms only.</p>}
          {layout && layout.id !== project.activeLayoutId && <p className="rounded-control bg-canvas px-2 py-1">Viewing an older layout, not the active one.</p>}
          {layout && staleRooms.length > 0 && <p className="rounded-control bg-orange-50 px-2 py-1 text-orange-900">Some rooms changed since this layout was generated.</p>}
          {focusRoom && layout && (
            <>
              <h2 className="serif text-base text-ink">{focusRoom.label}</h2>
              {roomItems.length === 0 ? (
                <p>No furniture placed in this room.</p>
              ) : (
                <ul className="space-y-1">
                  {roomItems.map((l) => (
                    <li key={l.catalogItemId} className="flex justify-between gap-2">
                      <span className="truncate">
                        {l.quantity} × {l.name}
                      </span>
                      <span className="tnum shrink-0">{formatUsd(l.priceMinor * l.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {!focusRoom && layout && <p>Select a room on the plan or in the menu to focus on it.</p>}
        </aside>
      </div>
    </div>
  )
}
