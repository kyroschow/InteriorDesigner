import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { RoomFurnitureCard } from '@/components/RoomFurnitureCard'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { useFurnitureStore } from '@/store/furnitureStore'

/**
 * Step 1's left pane (rendered inside ProjectLayout's <Outlet/>): per-room
 * furniture request. Always for the hardcoded Birch Two-Bed plan for now
 * (regardless of scratch/upload choice; see PLAN.md §5, no layout generation
 * backend yet).
 */
export function WorkspaceScreen() {
  const navigate = useNavigate()
  const quantities = useFurnitureStore((s) => s.quantities)

  const totalItems = useMemo(() => Object.values(quantities).reduce((sum, n) => sum + n, 0), [quantities])

  return (
    <>
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {birchTwoBed.rooms.map((room) => (
          <RoomFurnitureCard key={room.id} room={room} />
        ))}
      </div>

      <div className="shrink-0 border-t border-canvas-line p-4">
        <button
          type="button"
          disabled={totalItems === 0}
          title={totalItems === 0 ? 'Add some furniture first' : undefined}
          onClick={() => navigate('/project/rules')}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-control px-5 py-2.5 text-sm font-semibold transition-transform',
            totalItems === 0
              ? 'cursor-not-allowed bg-canvas text-ink-soft/50'
              : 'bg-ink text-app hover:-translate-y-0.5',
          )}
        >
          Next: Design rules
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  )
}
