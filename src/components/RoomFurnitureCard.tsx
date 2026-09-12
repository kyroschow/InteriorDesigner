import { useEffect, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { FurnitureRequirementRow } from '@/components/FurnitureRequirementRow'
import { RoomStatusBadge } from '@/components/RoomStatusBadge'
import { polygonSizeM } from '@/lib/sceneCoordinates'
import { formatAreaM2, formatLengthM } from '@/lib/units'
import { useProjectContext } from '@/screens/ProjectLayout'
import type { ObjectType, Requirement, Room, RoomStatus } from '@/types/interior'

interface RoomFurnitureCardProps {
  /** null = requirements the planner may place in any eligible room. */
  room: Room | null
  status?: RoomStatus
  children?: ReactNode
}

/** One room's furniture request: header, then one line per furniture type allowed there. */
export function RoomFurnitureCard({ room, status, children }: RoomFurnitureCardProps) {
  const { project, catalog, draft, setDraft, configErrors, selectedRoomId, setSelectedRoomId } = useProjectContext()
  const cardRef = useRef<HTMLDivElement>(null)
  const roomId = room?.id ?? null
  const selected = roomId !== null && selectedRoomId === roomId

  useEffect(() => {
    if (selected) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected])

  const roomTypes = new Set(project.floor.rooms.map((r) => r.type))
  const types = catalog.types.filter((t) => (room ? t.roomTypes.includes(room.type) : t.roomTypes.some((rt) => roomTypes.has(rt))))

  const update = (objectType: ObjectType, next: Requirement | null) =>
    setDraft((d) => {
      const index = d.requirements.findIndex((r) => r.roomId === roomId && r.objectType === objectType)
      if (!next) return { ...d, requirements: d.requirements.filter((_, i) => i !== index) }
      if (index === -1) return { ...d, requirements: [...d.requirements, next] }
      return { ...d, requirements: d.requirements.map((r, i) => (i === index ? next : r)) }
    })

  const size = room ? polygonSizeM(room.polygon) : null

  return (
    <div ref={cardRef} className={clsx('panel rounded-card p-4 transition-shadow', selected && 'ring-2 ring-accent')}>
      <button type="button" onClick={() => roomId && setSelectedRoomId(selected ? null : roomId)} className="mb-2 flex w-full items-baseline justify-between gap-2 text-left">
        <span className="min-w-0">
          <span className="serif block truncate text-base text-ink">{room ? room.label : 'Anywhere in the home'}</span>
          <span className="tnum block text-[11px] text-ink-soft/50">
            {room && size
              ? `${formatLengthM(size.w, project.unitSystem)} × ${formatLengthM(size.d, project.unitSystem)} · ${formatAreaM2(room.area_m2, project.unitSystem)}`
              : 'The planner picks an eligible room for these'}
          </span>
        </span>
        <RoomStatusBadge status={status} />
      </button>

      {types.length > 0 ? (
        <div className="divide-y divide-canvas-line">
          {types.map((type) => {
            const requirement = draft.requirements.find((r) => r.roomId === roomId && r.objectType === type.id)
            return (
              <FurnitureRequirementRow
                key={type.id}
                type={type}
                roomId={roomId}
                requirement={requirement}
                errors={requirement ? configErrors.filter((e) => e.requirementId === requirement.id).map((e) => e.message ?? e.code) : []}
                onChange={(next) => update(type.id, next)}
              />
            )
          })}
        </div>
      ) : (
        <p className="py-1 text-xs text-ink-soft/60">No furniture types are available for this room category.</p>
      )}

      {children}
    </div>
  )
}
