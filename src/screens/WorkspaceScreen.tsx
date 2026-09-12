import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Undo2, Wand2 } from 'lucide-react'
import clsx from 'clsx'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { RoomFurnitureCard } from '@/components/RoomFurnitureCard'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { RULE_PACKS } from '@/data/ruleLibrary'
import { placeAllFurniture } from '@/lib/furniturePlacement'
import { downloadSvgAsPng } from '@/lib/exportSvg'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useFurnitureStore } from '@/store/furnitureStore'

type Stage = 'input' | 'result'

/**
 * The project workspace — always loads the hardcoded Birch Two-Bed plan for now
 * (regardless of scratch/upload choice; see PLAN.md §5, no layout generation
 * backend yet). Left: per-room furniture request. Center: the 2D plan, either
 * bare (input stage) or furnished (result stage, after "Generate").
 */
export function WorkspaceScreen() {
  const navigate = useNavigate()
  const mode = useOnboardingStore((s) => s.mode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)
  const quantities = useFurnitureStore((s) => s.quantities)
  const getQuantity = useFurnitureStore((s) => s.getQuantity)

  const [stage, setStage] = useState<Stage>('input')
  const [selectedRulePacks, setSelectedRulePacks] = useState<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const totalItems = useMemo(() => Object.values(quantities).reduce((sum, n) => sum + n, 0), [quantities])

  // Recomputed from current quantities whenever they change; only shown once "Generate" is clicked.
  const furniture = useMemo(
    () => placeAllFurniture(birchTwoBed.rooms, FURNITURE_BY_ROOM_TYPE, getQuantity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities],
  )

  function toggleRulePack(id: string) {
    setSelectedRulePacks((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function handleExport() {
    if (svgRef.current) downloadSvgAsPng(svgRef.current, `${birchTwoBed.id}-floor-plan.png`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-canvas-line px-6 py-3">
        <div className="flex items-center gap-4">
          <Brand size="sm" />
          <span className="text-sm text-ink-soft/60">{birchTwoBed.name}</span>
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
        <aside className="no-scrollbar w-80 shrink-0 space-y-4 overflow-y-auto border-r border-canvas-line p-4">
          {birchTwoBed.rooms.map((room) => (
            <RoomFurnitureCard key={room.id} room={room} />
          ))}
        </aside>

        <main className="flex flex-1 flex-col overflow-auto p-8">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-2xl">
              <FloorPlanSvg ref={svgRef} plan={birchTwoBed} furniture={stage === 'result' ? furniture : undefined} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.1em] text-ink-soft/50 uppercase">
                Design rules
              </div>
              <div className="flex flex-wrap gap-2">
                {RULE_PACKS.map((pack) => {
                  const selected = selectedRulePacks.includes(pack.id)
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      title={pack.description}
                      onClick={() => toggleRulePack(pack.id)}
                      className={clsx(
                        'rounded-control border px-3 py-1.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-accent bg-accent-pale text-accent-deep'
                          : 'border-canvas-line text-ink-soft hover:border-accent/50',
                      )}
                    >
                      {pack.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              {stage === 'input' ? (
                <button
                  type="button"
                  disabled={totalItems === 0}
                  title={totalItems === 0 ? 'Add some furniture first' : undefined}
                  onClick={() => setStage('result')}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-control px-5 py-2.5 text-sm font-semibold transition-transform',
                    totalItems === 0
                      ? 'cursor-not-allowed bg-canvas text-ink-soft/50'
                      : 'bg-ink text-app hover:-translate-y-0.5',
                  )}
                >
                  <Wand2 size={16} />
                  Generate layout
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStage('input')}
                    className="inline-flex items-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
                  >
                    <Undo2 size={16} />
                    Back to edit
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
                  >
                    <Download size={16} />
                    Export PNG
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
