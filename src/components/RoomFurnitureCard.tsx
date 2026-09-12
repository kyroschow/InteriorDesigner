import type { RoomSpec } from '@/lib/floorplan'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { formatArea, sqInToSqFt } from '@/lib/units'
import { useFurnitureStore } from '@/store/furnitureStore'
import { QuantityStepper } from '@/components/QuantityStepper'

interface RoomFurnitureCardProps {
  room: RoomSpec
}

/** One room's furniture request: name/area header, then a stepper per available item. */
export function RoomFurnitureCard({ room }: RoomFurnitureCardProps) {
  const items = FURNITURE_BY_ROOM_TYPE[room.type]
  const quantities = useFurnitureStore((s) => s.quantities)
  const setQuantity = useFurnitureStore((s) => s.setQuantity)

  return (
    <div className="panel rounded-card p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="serif text-base text-ink">{room.name}</h3>
        <span className="tnum shrink-0 text-xs text-ink-soft/50">
          {formatArea(sqInToSqFt(room.footprint.w * room.footprint.h))}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-canvas-line">
          {items.map((item) => (
            <QuantityStepper
              key={item.id}
              label={item.label}
              max={item.max}
              value={quantities[`${room.id}:${item.id}`] ?? 0}
              onChange={(value) => setQuantity(room.id, item.id, value, item.max)}
            />
          ))}
        </div>
      ) : (
        <p className="py-1 text-xs text-ink-soft/50">No furniture catalog for this room yet.</p>
      )}
    </div>
  )
}
