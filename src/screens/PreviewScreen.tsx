import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { api, isAbort } from '@/api/client'
import { Brand } from '@/components/Brand'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { ZoomPanView } from '@/components/ZoomPanView'
import { exportPlan, type ExportFormat } from '@/lib/exportSvg'
import { sceneFurniture, sceneToPlan, shortName } from '@/lib/sceneCoordinates'
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
  const [images, setImages] = useState<Map<string, string | null>>(new Map())
  const [layout, setLayout] = useState<Layout | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [showFurniture, setShowFurniture] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [format, setFormat] = useState<ExportFormat>('png')

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

  // Product photos for the furniture icons; the plan still renders (with placeholders) if this fails.
  useEffect(() => {
    const controller = new AbortController()
    api
      .getFurniture({}, controller.signal)
      .then((catalog) => setImages(new Map(catalog.items.map((i) => [i.id, i.imageUrl]))))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const scene = useMemo(() => (project ? (layout ? { floor: layout.scene, roomTransforms: project.roomTransforms } : project) : null), [project, layout])
  const plan = useMemo(() => (scene && project ? sceneToPlan(scene, project.name) : null), [scene, project])
  const furniture = useMemo(() => (layout && scene ? sceneFurniture(scene, (itemId) => images.get(itemId) ?? null) : undefined), [layout, scene, images])

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
  if (!project || !plan || !scene) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" />
        Loading preview…
      </div>
    )
  }

  const rooms = scene.floor.rooms
  const focusRoom = rooms.find((r) => r.id === roomId)
  const roomItems = focusRoom && layout ? layout.placements.filter((p) => p.roomId === focusRoom.id) : []
  const baseName = `${project.name.replace(/[^\w-]+/g, '-').toLowerCase()}${focusRoom ? `-${focusRoom.label.replace(/[^\w-]+/g, '-').toLowerCase()}` : ''}`

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
          <span className="flex items-center gap-1">
            <select aria-label="Export format" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className="rounded-control border border-canvas-line bg-app px-1.5 py-1 text-xs text-ink">
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              type="button"
              onClick={() => svgRef.current && exportPlan(svgRef.current, format, baseName, `${project.name}${focusRoom ? ` — ${focusRoom.label}` : ''}`)}
              className="inline-flex items-center gap-1.5 rounded-control bg-ink px-3 py-1.5 font-semibold text-app"
            >
              <Download size={13} />
              Export
            </button>
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="flex min-h-[60vh] flex-1 overflow-hidden p-4">
          <ZoomPanView resetKey={roomId} className="min-h-0 flex-1">
            <div className="flex h-full w-full items-center justify-center p-2">
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
            </div>
          </ZoomPanView>
        </main>
        <aside className="shrink-0 space-y-2 border-canvas-line p-4 text-xs text-ink-soft lg:w-72 lg:border-l">
          {!layout && <p>Configured — awaiting generation. Showing rooms only.</p>}
          {layout && layout.id !== project.activeLayoutId && <p className="rounded-control bg-canvas px-2 py-1">Viewing an older layout, not the active one.</p>}
          {layout && project.stale && <p className="rounded-control bg-orange-50 px-2 py-1 text-orange-900">{project.stale.reason} This layout may be out of date.</p>}
          {focusRoom && layout && (
            <>
              <h2 className="serif text-base text-ink">{focusRoom.label}</h2>
              {roomItems.length === 0 ? (
                <p>No furniture placed in this room.</p>
              ) : (
                <ul className="space-y-1">
                  {roomItems.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate" title={p.name}>
                        {shortName(p.name)}
                      </span>
                      <span className="tnum shrink-0">{p.priceMinor !== null ? formatUsd(p.priceMinor) : '—'}</span>
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
