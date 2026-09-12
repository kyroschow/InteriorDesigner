import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ShoppingCart, Undo2 } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { placeAllFurniture } from '@/lib/furniturePlacement'
import { downloadSvgAsPng } from '@/lib/exportSvg'
import { useFurnitureStore } from '@/store/furnitureStore'

/** Step 3: the generated, furnished plan — nothing left to configure, just export it. */
export function ExportScreen() {
  const navigate = useNavigate()
  const getQuantity = useFurnitureStore((s) => s.getQuantity)
  const quantities = useFurnitureStore((s) => s.quantities)
  const svgRef = useRef<SVGSVGElement>(null)

  const furniture = useMemo(
    () => placeAllFurniture(birchTwoBed.rooms, FURNITURE_BY_ROOM_TYPE, getQuantity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities],
  )

  function handleExport() {
    if (svgRef.current) downloadSvgAsPng(svgRef.current, `${birchTwoBed.id}-floor-plan.png`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-canvas-line px-6 py-3">
        <div className="flex items-center gap-4">
          <Brand size="sm" />
          <span className="text-sm text-ink-soft/60">{birchTwoBed.name} — furnished</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/project')}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <Undo2 size={16} />
          Back to edit
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center overflow-auto p-8">
        <div className="w-full max-w-3xl">
          <FloorPlanSvg ref={svgRef} plan={birchTwoBed} furniture={furniture} />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/project/shopping-list')}
            className="inline-flex items-center gap-2 rounded-control px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
          >
            <ShoppingCart size={16} />
            Shopping List
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-control bg-ink px-6 py-3 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
          >
            <Download size={16} />
            Export PNG
          </button>
        </div>
      </main>
    </div>
  )
}
