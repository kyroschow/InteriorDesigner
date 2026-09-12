import { useMemo, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { placeAllFurniture } from '@/lib/furniturePlacement'
import { withProductLabels } from '@/lib/furnitureLabels'
import { downloadSvgAsPng, downloadSvgAsSvgFile, printSvgAsPdf } from '@/lib/exportSvg'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useFurnitureStore } from '@/store/furnitureStore'

export type ExportFormat = 'png' | 'svg' | 'pdf'

export interface ProjectOutletContext {
  exportPlan: (format: ExportFormat) => void
}

const FURNISHED_PATHS = ['/project/export']

/**
 * Shared chrome for every workspace step (/project, /project/rules,
 * /project/export): header + floor plan stay mounted across all of them —
 * only the left pane (the <Outlet/>) swaps — so the plan never re-renders or
 * jumps when moving between steps.
 */
export function ProjectLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const mode = useOnboardingStore((s) => s.mode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)
  const getQuantity = useFurnitureStore((s) => s.getQuantity)
  const quantities = useFurnitureStore((s) => s.quantities)
  const getProductChoice = useFurnitureStore((s) => s.getProductChoice)
  const productChoices = useFurnitureStore((s) => s.productChoices)
  const svgRef = useRef<SVGSVGElement>(null)

  const showFurniture = FURNISHED_PATHS.includes(location.pathname)
  const furniture = useMemo(
    () => withProductLabels(placeAllFurniture(birchTwoBed.rooms, FURNITURE_BY_ROOM_TYPE, getQuantity), getProductChoice),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities, productChoices],
  )

  function exportPlan(format: ExportFormat) {
    const svg = svgRef.current
    if (!svg) return
    if (format === 'png') downloadSvgAsPng(svg, `${birchTwoBed.id}-floor-plan.png`)
    else if (format === 'svg') downloadSvgAsSvgFile(svg, `${birchTwoBed.id}-floor-plan.svg`)
    else printSvgAsPdf(svg, `${birchTwoBed.name} — floor plan`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-canvas-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Brand size="sm" />
          <span className="shrink-0 text-sm text-ink-soft/60">
            {birchTwoBed.name}
            {showFurniture ? ' — furnished' : ''}
          </span>
          {mode === 'upload' && uploadedFile ? (
            <span
              title={`Imported: ${uploadedFile.name} — using the Birch Two-Bed sample plan for now, not this file`}
              className="min-w-0 truncate rounded-control bg-accent-pale px-2 py-1 text-xs font-medium text-accent-deep"
            >
              Imported: {uploadedFile.name}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex shrink-0 items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Start over
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-80 shrink-0 overflow-hidden border-r border-canvas-line">
          <div key={location.pathname} className="animate-pane-in flex h-full flex-col">
            <Outlet context={{ exportPlan } satisfies ProjectOutletContext} />
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
