import { forwardRef } from 'react'
import { Archive, Armchair, BedDouble, CookingPot, Droplets, Lamp, Package, ShowerHead, Sofa, Toilet, Tv, UtensilsCrossed, type LucideIcon } from 'lucide-react'
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
/** Product icon size inside a furniture block (inches); smaller blocks get no icon. */
const ICON_MAX_IN = 22
const ICON_MIN_IN = 7

/** Placeholder icon per furniture type, for pieces with no product photo. */
const TYPE_ICON: Record<string, LucideIcon> = {
  bed: BedDouble,
  dresser: Archive,
  nightstand: Lamp,
  tv_stand: Tv,
  sofa: Sofa,
  dining_table: UtensilsCrossed,
  dining_chair: Armchair,
  kitchen_counter: CookingPot,
  sink: Droplets,
  shower: ShowerHead,
  toilet: Toilet,
}
/** Extra margin that holds room labels drawn outside the plan. */
const OUTSIDE_LABEL_PAD = 20
const OUTSIDE_LABEL_GAP = 12
const EDGE_TOLERANCE_IN = 1

/**
 * Where a room's label goes outside the plan: beyond the shell edge the room
 * touches (top, bottom, left, right, in that order), or just above the room
 * when the view is cropped to it.
 */
function outsideLabelPosition(r: { x: number; y: number; w: number; h: number }, bounds: { w: number; h: number }, focused: boolean) {
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  if (focused || r.y <= EDGE_TOLERANCE_IN) return { x: cx, y: r.y - OUTSIDE_LABEL_GAP, anchor: 'middle' as const, baseline: 'auto' as const }
  if (r.y + r.h >= bounds.h - EDGE_TOLERANCE_IN) return { x: cx, y: r.y + r.h + OUTSIDE_LABEL_GAP, anchor: 'middle' as const, baseline: 'hanging' as const }
  if (r.x <= EDGE_TOLERANCE_IN) return { x: r.x - OUTSIDE_LABEL_GAP, y: cy, anchor: 'end' as const, baseline: 'middle' as const }
  return { x: r.x + r.w + OUTSIDE_LABEL_GAP, y: cy, anchor: 'start' as const, baseline: 'middle' as const }
}

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
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const iconSize = box.fixed ? 0 : Math.min(ICON_MAX_IN, Math.min(box.w, box.h) - 6)
  const hasIcon = iconSize >= ICON_MIN_IN
  const labelShown = showLabel && box.showLabel
  const fitsInside = box.w >= box.label.length * fontSize * 0.55 + 6 && box.h >= (hasIcon ? iconSize + fontSize + 10 : fontSize + 6)
  // Outside a small piece the full name sprawls across walls; its first word is enough there.
  const text = fitsInside ? box.label : box.label.split(/[\s(]/)[0]
  // Icon and label stack in the middle when both fit; otherwise the icon is centered and the label sits above.
  const stacked = hasIcon && labelShown && fitsInside
  const iconX = cx - iconSize / 2
  const iconY = stacked ? cy - (iconSize + fontSize + 3) / 2 : cy - iconSize / 2
  const labelY = stacked ? iconY + iconSize + 3 + fontSize / 2 : fitsInside ? cy : box.y - 4
  const PlaceholderIcon = (box.kind && TYPE_ICON[box.kind]) || Package
  return (
    <g>
      <title>{box.label}</title>
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
      {hasIcon &&
        (box.imageUrl ? (
          <g pointerEvents="none">
            <image href={box.imageUrl} x={iconX} y={iconY} width={iconSize} height={iconSize} preserveAspectRatio="xMidYMid meet" />
          </g>
        ) : (
          <g pointerEvents="none">
            <PlaceholderIcon x={iconX + iconSize * 0.15} y={iconY + iconSize * 0.15} size={iconSize * 0.7} color="var(--color-ink-soft)" strokeWidth={1.75} opacity={0.7} aria-hidden />
          </g>
        ))}
      {labelShown && (
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          dominantBaseline={fitsInside ? 'middle' : 'auto'}
          fontSize={fontSize}
          fill="var(--color-ink-soft)"
          stroke={fitsInside ? undefined : 'var(--color-card)'}
          strokeWidth={fitsInside ? undefined : 3}
          paintOrder="stroke"
        >
          {text}
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
        <line x1={door.x} y1={door.y} x2={x2} y2={y2} stroke="var(--color-app)" strokeWidth={WALL_WIDTH + 1.5} />
        <line x1={door.x - dx} y1={door.y - dy} x2={x2 - dx} y2={y2 - dy} stroke={WALL_COLOR} strokeWidth={0.8} />
        <line x1={door.x + dx} y1={door.y + dy} x2={x2 + dx} y2={y2 + dy} stroke={WALL_COLOR} strokeWidth={0.8} />
      </g>
    )
  }
  // Doors and doorways: paint over the wall line.
  return <line x1={door.x} y1={door.y} x2={x2} y2={y2} stroke="var(--color-app)" strokeWidth={WALL_WIDTH + 2.5} />
}

export const FloorPlanSvg = forwardRef<SVGSVGElement, FloorPlanSvgProps>(function FloorPlanSvg(
  { plan, unitSystem, furniture, showLabels = true, selectedRoomId, focusRoomId, onSelectRoom },
  ref,
) {
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const focus = focusRoomId ? plan.rooms.find((r) => r.id === focusRoomId)?.footprint : undefined
  // With furniture drawn, room labels move outside the plan so they never cover a piece.
  const labelsOutside = Boolean(furniture) && showLabels
  const pad = (focus ? FOCUS_PAD : PAD) + (labelsOutside ? OUTSIDE_LABEL_PAD : 0)
  const viewBox = focus
    ? `${focus.x - pad} ${focus.y - pad} ${focus.w + pad * 2} ${focus.h + pad * 2}`
    : `${-pad} ${-pad} ${bounds.w + pad * 2} ${bounds.h + pad * 2}`
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

      {/* Outer envelope before the openings, so an exterior door isn't painted back over by this stroke. */}
      <rect x={0} y={0} width={bounds.w} height={bounds.h} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_WIDTH + 1.5} />

      {plan.doors?.map((door, i) => <Opening key={i} door={door} />)}

      {furniture &&
        plan.rooms.flatMap((room) =>
          (furniture[room.id] ?? []).map((box) => (
            <g key={`${room.id}-${box.id}`} opacity={dim(room.id)}>
              <Box box={box} showLabel={showLabels} />
            </g>
          )),
        )}

      {labelsOutside &&
        plan.rooms
          .filter((room) => !focusRoomId || room.id === focusRoomId)
          .map((room) => {
            const pos = outsideLabelPosition(room.footprint, bounds, Boolean(focus))
            return (
              <text key={room.id} x={pos.x} y={pos.y} textAnchor={pos.anchor} dominantBaseline={pos.baseline} pointerEvents="none">
                <tspan fontSize={14} fontWeight={600} fontFamily="var(--font-serif)" fill="var(--color-ink)">
                  {room.name}
                </tspan>
                <tspan fontSize={10} fill="var(--color-ink-soft)">
                  {` · ${formatAreaBySystem(room.footprint.w * room.footprint.h, unitSystem)}`}
                </tspan>
              </text>
            )
          })}

      {showLabels &&
        !labelsOutside &&
        plan.rooms.map((room) => {
          const c = rectCenter(room.footprint)
          const narrow = Math.min(room.footprint.w, room.footprint.h) < NARROW_THRESHOLD_IN
          const rotate = narrow && room.footprint.w < room.footprint.h
          const nameY = narrow ? c.y : room.footprint.y + LABEL_TOP_OFFSET_IN
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
