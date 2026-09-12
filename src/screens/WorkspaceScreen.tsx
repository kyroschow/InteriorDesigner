import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { RoomFurnitureCard } from '@/components/RoomFurnitureCard'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useFurnitureStore } from '@/store/furnitureStore'

/**
 * Step 1 of the workspace: per-room furniture request. Always loads the
 * hardcoded Birch Two-Bed plan for now (regardless of scratch/upload choice;
 * see PLAN.md §5, no layout generation backend yet).
 */
export function WorkspaceScreen() {
  const navigate = useNavigate()
  const mode = useOnboardingStore((s) => s.mode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)
  const quantities = useFurnitureStore((s) => s.quantities)

  const totalItems = useMemo(() => Object.values(quantities).reduce((sum, n) => sum + n, 0), [quantities])

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
              <FloorPlanSvg plan={birchTwoBed} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={totalItems === 0}
              title={totalItems === 0 ? 'Add some furniture first' : undefined}
              onClick={() => navigate('/project/rules')}
              className={clsx(
                'inline-flex items-center gap-2 rounded-control px-5 py-2.5 text-sm font-semibold transition-transform',
                totalItems === 0
                  ? 'cursor-not-allowed bg-canvas text-ink-soft/50'
                  : 'bg-ink text-app hover:-translate-y-0.5',
              )}
            >
              Next: Design rules
              <ArrowRight size={16} />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
