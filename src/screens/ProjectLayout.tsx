import { useMemo, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { placeAllFurniture } from '@/lib/furniturePlacement'
import { downloadSvgAsPng } from '@/lib/exportSvg'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useFurnitureStore } from '@/store/furnitureStore'

export interface ProjectOutletContext {
  downloadPng: () => void
}

const FURNISHED_PATHS = ['/project/export', '/project/shopping-list']

/**
 * Shared chrome for every workspace step (/project, /project/rules,
 * /project/export, /project/shopping-list): header + floor plan stay mounted
 * across all of them — only the left pane (the <Outlet/>) swaps — so the plan
 * never re-renders or jumps when moving between steps.
 */
export function ProjectLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const mode = useOnboardingStore((s) => s.mode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)
  const getQuantity = useFurnitureStore((s) => s.getQuantity)
  const quantities = useFurnitureStore((s) => s.quantities)
  const svgRef = useRef<SVGSVGElement>(null)

  const showFurniture = FURNISHED_PATHS.includes(location.pathname)
  const furniture = useMemo(
    () => placeAllFurniture(birchTwoBed.rooms, FURNITURE_BY_ROOM_TYPE, getQuantity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities],
  )

  function downloadPng() {
    if (svgRef.current) downloadSvgAsPng(svgRef.current, `${birchTwoBed.id}-floor-plan.png`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-canvas-line px-6 py-3">
        <div className="flex items-center gap-4">
          <Brand size="sm" />
          <span className="text-sm text-ink-soft/60">
            {birchTwoBed.name}
            {showFurniture ? ' — furnished' : ''}
          </span>
          {mode === 'upload' && uploadedFile ? (
            <span className="rounded-control bg-accent-pale px-2 py-1 text-xs font-medium text-accent-deep">
              Imported: {uploadedFile.name} (using sample plan for now)
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Start over
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-80 shrink-0 overflow-hidden border-r border-canvas-line">
          <div key={location.pathname} className="animate-pane-in flex h-full flex-col">
            <Outlet context={{ downloadPng } satisfies ProjectOutletContext} />
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="w-full max-w-2xl">
            <FloorPlanSvg ref={svgRef} plan={birchTwoBed} furniture={showFurniture ? furniture : undefined} />
          </div>
        </main>
      </div>
    </div>
  )
}
