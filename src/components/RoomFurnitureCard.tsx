import { useEffect, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { FurnitureRequirementRow } from '@/components/FurnitureRequirementRow'
import { RoomStatusBadge } from '@/components/RoomStatusBadge'
import { polygonSizeM } from '@/lib/sceneCoordinates'
import { formatAreaM2, formatLengthM } from '@/lib/units'
import { useProjectContext } from '@/screens/ProjectLayout'
import type { Requirement, Room, RoomStatus } from '@/types/interior'

const typeMatches = (itemType: string, requested: string) => itemType === requested || itemType.startsWith(`${requested}.`)

interface RoomFurnitureCardProps {
  /** null = requirements the generator may place in any suitable room. */
  room: Room | null
  status?: RoomStatus
  children?: ReactNode
}

/** One room's furniture request: header, one line per eligible type, then unavailable types with reasons. */
export function RoomFurnitureCard({ room, status, children }: RoomFurnitureCardProps) {
  const { project, catalog, draft, setDraft, configErrors, selectedRoomId, setSelectedRoomId } = useProjectContext()
  const cardRef = useRef<HTMLDivElement>(null)
  const roomId = room?.id ?? null
  const selected = roomId !== null && selectedRoomId === roomId

  useEffect(() => {
    if (selected) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected])

  const roomTypes = new Set(project.floor.rooms.map((r) => r.type))
  const types = catalog.types.filter((t) => (room ? t.allowedRoomTypes.includes(room.type) : t.allowedRoomTypes.some((rt) => roomTypes.has(rt))))
  const available = types.filter((t) => t.available)
  const unavailable = types.filter((t) => !t.available)

  const update = (objectType: string, next: Requirement | null) =>
    setDraft((d) => {
      const others = d.requirements.filter((r) => !(r.roomId === roomId && r.objectType === objectType))
      const existingIndex = d.requirements.findIndex((r) => r.roomId === roomId && r.objectType === objectType)
      if (!next) return { ...d, requirements: others }
      if (existingIndex === -1) return { ...d, requirements: [...d.requirements, next] }
      return { ...d, requirements: d.requirements.map((r, i) => (i === existingIndex ? next : r)) }
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
              : 'The generator picks a suitable room for these'}
          </span>
        </span>
        <RoomStatusBadge status={status} />
      </button>

      {available.length > 0 ? (
        <div className="divide-y divide-canvas-line">
          {available.map((type) => {
            const requirement = draft.requirements.find((r) => r.roomId === roomId && r.objectType === type.objectType)
            const availableColors = [
              ...new Set(catalog.items.filter((i) => i.selectionStatus === 'eligible' && typeMatches(i.objectType, type.objectType)).flatMap((i) => i.colorFamilies)),
            ]
            return (
              <FurnitureRequirementRow
                key={type.objectType}
                type={type}
                roomId={roomId}
                requirement={requirement}
                colorFamilies={catalog.colorFamilies}
                availableColors={availableColors}
                unitSystem={project.unitSystem}
                errors={requirement ? configErrors.filter((e) => e.requirementId === requirement.id).map((e) => e.message ?? e.code) : []}
                onChange={(next) => update(type.objectType, next)}
              />
            )
          })}
        </div>
      ) : (
        <p className="py-1 text-xs text-ink-soft/60">Nothing can be generated for this room type yet.</p>
      )}

      {unavailable.length > 0 && (
        <details className="mt-2 text-[11px] text-ink-soft/60">
          <summary className="cursor-pointer">Not available yet ({unavailable.length})</summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {unavailable.map((t) => (
              <li key={t.objectType}>
                <span className="font-medium text-ink-soft">{t.label}</span> — {t.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {children}
    </div>
  )
}
