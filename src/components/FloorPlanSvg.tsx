import { forwardRef } from 'react'
import { floorPlanBounds, floorPlanWalls, ROOM_TYPE_COLOR, type Door, type FloorPlan, type PlanBox } from '@/lib/floorplan'
import { rectCenter } from '@/lib/geometry'
import { formatAreaBySystem } from '@/lib/units'
import type { UnitSystem } from '@/types/interior'

interface FloorPlanSvgProps {
  plan: FloorPlan
  unitSystem: UnitSystem
  /** Furniture boxes to draw on top, keyed by room id — omit to show the bare plan. */
  furniture?: Record<string, PlanBox[]>
  showLabels?: boolean
  selectedRoomId?: string | null
  /** Crops the view to one room and dims the others. */
  focusRoomId?: string | null
  onSelectRoom?: (roomId: string) => void
}

const WALL_COLOR = 'var(--color-wall)'
const WALL_WIDTH = 3.5
/** Rooms narrower than this (inches) get a compact, name-only label. */
const NARROW_THRESHOLD_IN = 72
/** Room labels sit near the top so they rarely collide with furniture. */
const LABEL_TOP_OFFSET_IN = 18
const PAD = 24
const FOCUS_PAD = 30

function frontLine(b: PlanBox) {
  const i = 2.5
  switch (b.front) {
    case 'top':
      return { x1: b.x + i, y1: b.y + i, x2: b.x + b.w - i, y2: b.y + i }
    case 'bottom':
      return { x1: b.x + i, y1: b.y + b.h - i, x2: b.x + b.w - i, y2: b.y + b.h - i }
    case 'left':
      return { x1: b.x + i, y1: b.y + i, x2: b.x + i, y2: b.y + b.h - i }
    default:
      return { x1: b.x + b.w - i, y1: b.y + i, x2: b.x + b.w - i, y2: b.y + b.h - i }
  }
}

function Box({ box, showLabel }: { box: PlanBox; showLabel: boolean }) {
  const fontSize = box.fixed ? 7 : 8
  const fitsInside = box.w >= box.label.length * fontSize * 0.55 + 6 && box.h >= fontSize + 6
  return (
    <g>
      <title>{box.fixed ? `${box.label} (fixed)` : box.label}</title>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={box.fixed ? 1.5 : 3}
        fill={box.fixed ? 'var(--color-canvas)' : 'var(--color-card)'}
        stroke={WALL_COLOR}
        strokeWidth={box.fixed ? 0.9 : 1.25}
        strokeDasharray={box.fixed ? '3 2' : undefined}
      />
      {!box.fixed && <line {...frontLine(box)} stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" />}
      {showLabel && box.showLabel && (
        <text
          x={box.x + box.w / 2}
          y={fitsInside ? box.y + box.h / 2 : box.y - 4}
          textAnchor="middle"
          dominantBaseline={fitsInside ? 'middle' : 'auto'}
          fontSize={fontSize}
          fill="var(--color-ink-soft)"
          stroke={fitsInside ? undefined : 'var(--color-card)'}
          strokeWidth={fitsInside ? undefined : 3}
          paintOrder="stroke"
        >
          {box.label}
        </text>
      )}
    </g>
  )
}

function Opening({ door }: { door: Door }) {
  const x2 = door.orientation === 'v' ? door.x : door.x + door.length
  const y2 = door.orientation === 'v' ? door.y + door.length : door.y
  if (door.kind === 'window') {
    const [dx, dy] = door.orientation === 'v' ? [1.3, 0] : [0, 1.3]
    return (
      <g>
        <line x1={door.x} y1={door.y} x2={x2} y2={y2} stroke="var(--color-app)" strokeWidth={WALL_WIDTH} />
        <line x1={door.x - dx} y1={door.y - dy} x2={x2 - dx} y2={y2 - dy} stroke={WALL_COLOR} strokeWidth={0.8} />
        <line x1={door.x + dx} y1={door.y + dy} x2={x2 + dx} y2={y2 + dy} stroke={WALL_COLOR} strokeWidth={0.8} />
      </g>
    )
  }
  // Doors and doorways: paint over the wall line.
  return <line x1={door.x} y1={door.y} x2={x2} y2={y2} stroke="var(--color-app)" strokeWidth={WALL_WIDTH + 1} />
}

export const FloorPlanSvg = forwardRef<SVGSVGElement, FloorPlanSvgProps>(function FloorPlanSvg(
  { plan, unitSystem, furniture, showLabels = true, selectedRoomId, focusRoomId, onSelectRoom },
  ref,
) {
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const focus = focusRoomId ? plan.rooms.find((r) => r.id === focusRoomId)?.footprint : undefined
  const viewBox = focus
    ? `${focus.x - FOCUS_PAD} ${focus.y - FOCUS_PAD} ${focus.w + FOCUS_PAD * 2} ${focus.h + FOCUS_PAD * 2}`
    : `${-PAD} ${-PAD} ${bounds.w + PAD * 2} ${bounds.h + PAD * 2}`
  const dim = (roomId: string) => (focusRoomId && roomId !== focusRoomId ? 0.35 : 1)

  return (
    <svg ref={ref} viewBox={viewBox} className="h-auto max-h-full w-full" role="img" aria-label={`${plan.name} floor plan`}>
      {plan.rooms.map((room) => {
        const r = room.footprint
        const interactive = Boolean(onSelectRoom)
        return (
          <rect
            key={room.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={ROOM_TYPE_COLOR[room.type]}
            opacity={dim(room.id)}
            className={interactive ? 'cursor-pointer outline-none' : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `Select ${room.name}` : undefined}
            aria-pressed={interactive ? selectedRoomId === room.id : undefined}
            onClick={interactive ? () => onSelectRoom?.(room.id) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectRoom?.(room.id)
                    }
                  }
                : undefined
            }
          />
        )
      })}

      {plan.fixtures?.map((box) => <Box key={box.id} box={box} showLabel={showLabels} />)}

      {walls.map((w, i) => (
        <line key={i} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={WALL_COLOR} strokeWidth={WALL_WIDTH} strokeLinecap="round" />
      ))}

      {plan.doors?.map((door, i) => <Opening key={i} door={door} />)}

      {/* Outer envelope, drawn a touch thicker. */}
      <rect x={0} y={0} width={bounds.w} height={bounds.h} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_WIDTH + 1.5} />

      {furniture &&
        plan.rooms.flatMap((room) =>
          (furniture[room.id] ?? []).map((box) => (
            <g key={`${room.id}-${box.id}`} opacity={dim(room.id)}>
              <Box box={box} showLabel={showLabels} />
            </g>
          )),
        )}

      {showLabels &&
        plan.rooms.map((room) => {
          const c = rectCenter(room.footprint)
          const narrow = Math.min(room.footprint.w, room.footprint.h) < NARROW_THRESHOLD_IN
          const rotate = narrow && room.footprint.w < room.footprint.h
          // Furniture hugs walls, so a furnished room's label moves to the (usually clear) center.
          const nameY = narrow ? c.y : furniture ? c.y - 7 : room.footprint.y + LABEL_TOP_OFFSET_IN
          const halo = { stroke: ROOM_TYPE_COLOR[room.type], strokeWidth: 4, strokeLinejoin: 'round' as const, paintOrder: 'stroke' }
          return (
            <g key={room.id} opacity={dim(room.id)} pointerEvents="none" transform={rotate ? `rotate(-90 ${c.x} ${c.y})` : undefined}>
              <text x={c.x} y={nameY} textAnchor="middle" dominantBaseline="middle" fontSize={narrow ? 11 : 15} fontWeight={600} fontFamily="var(--font-serif)" fill="var(--color-ink)" {...halo}>
                {room.name}
              </text>
              {!narrow && (
                <text x={c.x} y={nameY + 14} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="var(--color-ink-soft)" {...halo}>
                  {formatAreaBySystem(room.footprint.w * room.footprint.h, unitSystem)}
                </text>
              )}
            </g>
          )
        })}

      {selectedRoomId &&
        plan.rooms
          .filter((room) => room.id === selectedRoomId)
          .map((room) => (
            <rect
              key="selected"
              x={room.footprint.x + 3}
              y={room.footprint.y + 3}
              width={room.footprint.w - 6}
              height={room.footprint.h - 6}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              rx={4}
              pointerEvents="none"
            />
          ))}
    </svg>
  )
})
