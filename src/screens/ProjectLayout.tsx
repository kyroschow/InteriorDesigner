import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { Eye, Home, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { ApiError, api } from '@/api/client'
import { Brand } from '@/components/Brand'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { useGenerationPolling } from '@/hooks/useGeneration'
import { useProjectData } from '@/hooks/useProject'
import { downloadSvgAsPng } from '@/lib/exportSvg'
import { draftPlan, sceneFurniture, sceneToPlan, type DraftRoomRect } from '@/lib/sceneCoordinates'
import { formatLengthM } from '@/lib/units'
import type { ApiErrorDetail, Configuration, FurnitureResponse, Generation, Layout, Project, RulesResponse, UnitSystem } from '@/types/interior'

/** Everything in the configuration except notes, which save separately via the note PATCH. */
export type ConfigDraft = Omit<Configuration, 'roomInstructions'>

export interface ProjectOutletContext {
  project: Project
  catalog: FurnitureResponse
  rules: RulesResponse
  activeLayout: Layout | null
  /** Latest generation for the project, polled while it runs. */
  generation: Generation | null
  generationActive: boolean
  applyProject: (project: Project) => void
  reload: () => Promise<Project>
  /**
   * Runs a project write after any in-flight one, handing it the latest project
   * so `expectedRevision` includes our own previous write (a rename committed on
   * blur followed by a click-triggered save would otherwise 409 against itself).
   * Writes from elsewhere still conflict.
   */
  write: <T>(fn: (current: Project) => Promise<T>) => Promise<T>
  draft: ConfigDraft
  setDraft: (update: (draft: ConfigDraft) => ConfigDraft) => void
  draftDirty: boolean
  /** Saves the draft with `PUT /configuration` when it differs from the server; resolves to the latest project. */
  saveDraft: () => Promise<Project>
  /** 422 details from the last failed configuration save. */
  configErrors: ApiErrorDetail[]
  selectedRoomId: string | null
  setSelectedRoomId: (roomId: string | null) => void
  /** Unsaved partition edits to preview on the canvas; null shows the saved rooms. */
  setRoomsPreview: (rects: DraftRoomRect[] | null) => void
  downloadPng: () => void
}

export const useProjectContext = () => useOutletContext<ProjectOutletContext>()

const draftOf = (project: Project): ConfigDraft => {
  const { revision: _revision, roomInstructions: _notes, ...rest } = project.configuration
  return structuredClone(rest)
}
const sameDraft = (a: ConfigDraft, b: ConfigDraft) => JSON.stringify(a) === JSON.stringify(b)

const STEPS = [
  { to: 'rooms', label: 'Rooms', end: false },
  { to: '', label: 'Furnish', end: true },
  { to: 'rules', label: 'Rules & apply', end: false },
  { to: 'export', label: 'Results', end: false },
]

/** Loads the project for `/projects/:projectId/*`, then hands off to the workspace chrome. */
export function ProjectLayout() {
  const { projectId = '' } = useParams()
  const { load, activeLayout, applyProject, reload, retry } = useProjectData(projectId)

  if (load.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" />
        Loading project…
      </div>
    )
  }
  if (load.status === 'error') {
    const notFound = load.error instanceof ApiError && load.error.status === 404
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Brand size="sm" />
        <h1 className="serif text-2xl text-ink">{notFound ? 'Project not found' : "Couldn't load this project"}</h1>
        {!notFound && <ErrorBanner error={load.error} className="w-full text-left" />}
        <div className="flex gap-2">
          {!notFound && (
            <button type="button" onClick={retry} className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-app">
              Try again
            </button>
          )}
          <Link to="/projects" className="rounded-control px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas">
            My projects
          </Link>
        </div>
      </div>
    )
  }
  return (
    <ProjectWorkspace
      key={projectId}
      project={load.project}
      catalog={load.catalog}
      rules={load.rules}
      activeLayout={activeLayout}
      applyProject={applyProject}
      reload={reload}
    />
  )
}

interface WorkspaceProps {
  project: Project
  catalog: FurnitureResponse
  rules: RulesResponse
  activeLayout: Layout | null
  applyProject: (project: Project) => void
  reload: () => Promise<Project>
}

/**
 * Shared chrome for every workspace step: header, step nav and floor plan
 * stay mounted — only the left pane (the <Outlet/>) swaps — so the plan never
 * jumps between steps and the configuration draft survives navigation.
 */
function ProjectWorkspace({ project, catalog, rules, activeLayout, applyProject, reload }: WorkspaceProps) {
  const location = useLocation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [headerError, setHeaderError] = useState<unknown>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomsPreview, setRoomsPreview] = useState<DraftRoomRect[] | null>(null)
  const [configErrors, setConfigErrors] = useState<ApiErrorDetail[]>([])

  // Configuration draft. Adopts server changes unless the user has unsaved edits.
  const serverDraft = useMemo(() => draftOf(project), [project])
  const [draft, setDraftState] = useState(serverDraft)
  const previousServerDraft = useRef(serverDraft)
  useEffect(() => {
    const previous = previousServerDraft.current
    previousServerDraft.current = serverDraft
    setDraftState((current) => (sameDraft(current, previous) ? serverDraft : current))
  }, [serverDraft])
  const draftDirty = !sameDraft(draft, serverDraft)

  // Latest known project, updated synchronously by our own writes (never moved back by a stale render).
  const projectRef = useRef(project)
  if (project.revision >= projectRef.current.revision) projectRef.current = project
  const draftRef = useRef(draft)
  draftRef.current = draft

  const applyLatest = useCallback(
    (next: Project) => {
      if (next.revision >= projectRef.current.revision) projectRef.current = next
      applyProject(next)
    },
    [applyProject],
  )

  const writeQueue = useRef<Promise<unknown>>(Promise.resolve())
  const write = useCallback(<T,>(fn: (current: Project) => Promise<T>): Promise<T> => {
    const run = writeQueue.current.catch(() => undefined).then(() => fn(projectRef.current))
    writeQueue.current = run
    return run
  }, [])

  const setDraft = useCallback((update: (d: ConfigDraft) => ConfigDraft) => {
    setDraftState((current) => update(current))
    setConfigErrors([])
  }, [])

  const saveDraft = useCallback(
    () =>
      write(async (current) => {
        if (sameDraft(draftRef.current, draftOf(current))) return current
        try {
          const next = await api.replaceConfiguration(current.id, {
            expectedRevision: current.revision,
            configuration: { ...draftRef.current, roomInstructions: current.configuration.roomInstructions },
          })
          setConfigErrors([])
          applyLatest(next)
          return next
        } catch (err) {
          if (err instanceof ApiError && err.status === 422) setConfigErrors(err.details)
          throw err
        }
      }),
    [write, applyLatest],
  )

  const { generation, active: generationActive } = useGenerationPolling(project.id, project.latestGenerationId, (_settled, wasRunning) => {
    if (wasRunning) reload().catch(setHeaderError)
  })

  async function patchProject(fields: { name?: string; unitSystem?: UnitSystem }) {
    setHeaderError(null)
    try {
      await write(async (current) => {
        const next = await api.updateProject(current.id, { expectedRevision: current.revision, ...fields })
        applyLatest(next)
        return next
      })
    } catch (err) {
      setHeaderError(err)
    }
  }

  const onResults = location.pathname.endsWith('/export')
  const savedPlan = useMemo(() => sceneToPlan(project, project.name), [project])
  const layoutPlan = useMemo(() => (activeLayout ? sceneToPlan(activeLayout, project.name) : null), [activeLayout, project.name])
  const furniture = useMemo(() => (activeLayout ? sceneFurniture(activeLayout) : undefined), [activeLayout])
  const showLayout = onResults && layoutPlan !== null
  const plan = showLayout ? (layoutPlan ?? savedPlan) : roomsPreview ? draftPlan(savedPlan, roomsPreview, project.footprintM.d) : savedPlan

  const context: ProjectOutletContext = {
    project,
    catalog,
    rules,
    activeLayout,
    generation,
    generationActive,
    applyProject: applyLatest,
    reload,
    write,
    draft,
    setDraft,
    draftDirty,
    saveDraft,
    configErrors,
    selectedRoomId,
    setSelectedRoomId,
    setRoomsPreview,
    downloadPng: () => {
      if (svgRef.current) downloadSvgAsPng(svgRef.current, `${project.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'floor-plan'}.png`)
    },
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-canvas-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Home">
            <Brand size="sm" />
          </Link>
          <ProjectNameField name={project.name} onSave={(name) => patchProject({ name })} />
          <span
            title="Uploaded plans are not analyzed yet; this project uses the four-room demo layout."
            className="hidden max-w-[18rem] min-w-0 truncate rounded-control bg-accent-pale px-2 py-1 text-[11px] font-medium text-accent-deep sm:inline-block"
          >
            Demo layout — uploaded plan not analyzed{project.floorPlanAsset ? ` · ${project.floorPlanAsset.name}` : ''}
          </span>
          <span
            title="Uploaded plans are not analyzed yet; this project uses the four-room demo layout."
            className="shrink-0 rounded-control bg-accent-pale px-2 py-1 text-[11px] font-medium text-accent-deep sm:hidden"
          >
            Demo
          </span>
          {generationActive && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-soft/70">
              <Loader2 size={12} className="animate-spin" />
              Generating{generation?.stage ? ` · ${generation.stage}` : '…'}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div role="radiogroup" aria-label="Units" className="flex rounded-control border border-canvas-line p-0.5 text-xs">
            {(['metric', 'imperial'] as const).map((system) => (
              <button
                key={system}
                type="button"
                role="radio"
                aria-checked={project.unitSystem === system}
                onClick={() => project.unitSystem !== system && patchProject({ unitSystem: system })}
                className={clsx('rounded-[7px] px-2 py-1 font-medium', project.unitSystem === system ? 'bg-ink text-app' : 'text-ink-soft hover:bg-canvas')}
              >
                {system === 'metric' ? 'm' : 'ft'}
              </button>
            ))}
          </div>
          <Link
            to={`/projects/${project.id}/preview`}
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
          >
            <Eye size={15} />
            Preview
          </Link>
          <Link to="/projects" aria-label="My projects" className="rounded-control p-2 text-ink-soft hover:bg-canvas">
            <Home size={16} />
          </Link>
        </div>
      </header>

      {headerError != null && (
        <div className="px-6 pt-2">
          <ErrorBanner error={headerError} onReload={() => reload().then(() => setHeaderError(null), setHeaderError)} onDismiss={() => setHeaderError(null)} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-canvas-line md:w-[26rem] md:border-r">
          <nav aria-label="Project steps" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-canvas-line px-3 py-2">
            {STEPS.map((step) => (
              <NavLink
                key={step.label}
                to={step.to ? `/projects/${project.id}/${step.to}` : `/projects/${project.id}`}
                end={step.end}
                className={({ isActive }) =>
                  clsx('shrink-0 rounded-control px-2.5 py-1.5 text-xs font-semibold', isActive ? 'bg-accent-pale text-accent-deep' : 'text-ink-soft/70 hover:bg-canvas')
                }
              >
                {step.label}
              </NavLink>
            ))}
          </nav>
          <div key={location.pathname} className="animate-pane-in flex min-h-0 flex-1 flex-col">
            <Outlet context={context} />
          </div>
        </aside>

        <main className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3 overflow-auto p-6 md:p-8">
          <div className="w-full max-w-2xl">
            <FloorPlanSvg
              ref={svgRef}
              plan={plan}
              unitSystem={project.unitSystem}
              furniture={showLayout ? furniture : undefined}
              selectedRoomId={selectedRoomId}
              onSelectRoom={(id) => setSelectedRoomId((current) => (current === id ? null : id))}
            />
          </div>
          <p className="text-center text-[11px] text-ink-soft/50">
            {formatLengthM(project.footprintM.w, project.unitSystem)} × {formatLengthM(project.footprintM.d, project.unitSystem)} shell · ceilings{' '}
            {formatLengthM(project.floor.height_m, project.unitSystem)} (fixed)
            {showLayout ? ' · blue edge marks each piece’s front · dashed outlines are fixed fixtures' : roomsPreview ? ' · previewing unsaved room edits' : ''}
          </p>
        </main>
      </div>
    </div>
  )
}

function ProjectNameField({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [value, setValue] = useState(name)
  useEffect(() => setValue(name), [name])
  const commit = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) onSave(trimmed.slice(0, 120))
    else setValue(name)
  }
  return (
    <input
      aria-label="Project name"
      value={value}
      maxLength={120}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setValue(name)
          e.currentTarget.blur()
        }
      }}
      className="w-40 min-w-0 truncate rounded-control border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-ink hover:border-canvas-line focus:border-accent focus:outline-none sm:w-56"
    />
  )
}
