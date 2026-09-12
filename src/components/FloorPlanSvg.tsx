import { forwardRef } from 'react'
import { floorPlanBounds, floorPlanWalls, ROOM_TYPE_COLOR, type CompassDirection, type Door, type FloorPlan, type PlanBox } from '@/lib/floorplan'
import { rectCenter, type Rect } from '@/lib/geometry'
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
  /** Which way the front door really faces; draws a compass and rotates the building to match. */
  doorFacing?: CompassDirection | null
}

const WALL_COLOR = 'var(--color-wall)'
const WALL_WIDTH = 3.5
/** Rooms narrower than this (inches) get a compact, name-only label. */
const NARROW_THRESHOLD_IN = 72
/** Room labels sit near the top so they rarely collide with furniture. */
const LABEL_TOP_OFFSET_IN = 18
const PAD = 24
const COMPASS_PAD = 34
const FOCUS_PAD = 30

const ANGLE: Record<CompassDirection, number> = { N: 0, E: 90, S: 180, W: 270 }

/**
 * The compass paper never moves (N up, E right, S down, W left). What rotates
 * is the building: the plan's entry door is authored on one side, so to make
 * it face the direction the client gave, spin the whole drawing clockwise.
 */
export function planRotation(plan: FloorPlan, doorFacing: CompassDirection | null | undefined): number {
  if (!doorFacing || !plan.entrySide) return 0
  return (((ANGLE[doorFacing] - ANGLE[plan.entrySide]) % 360) + 360) % 360
}

function rotatedBounds(r: Rect, cx: number, cy: number, theta: number): Rect {
  if (theta === 0) return r
  const cos = Math.round(Math.cos((theta * Math.PI) / 180))
  const sin = Math.round(Math.sin((theta * Math.PI) / 180))
  const corners = [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x, r.y + r.h],
    [r.x + r.w, r.y + r.h],
  ].map(([x, y]) => ({ x: cx + (x - cx) * cos - (y - cy) * sin, y: cy + (x - cx) * sin + (y - cy) * cos }))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
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

function Box({ box, showLabel, theta }: { box: PlanBox; showLabel: boolean; theta: number }) {
  const fontSize = box.fixed ? 7 : 8
  const visualW = theta % 180 === 0 ? box.w : box.h
  const visualH = theta % 180 === 0 ? box.h : box.w
  const fitsInside = visualW >= box.label.length * fontSize * 0.55 + 6 && visualH >= fontSize + 6
  // Outside a small piece the full name sprawls across walls; its first word is enough there.
  const text = fitsInside ? box.label : box.label.split(/[\s(]/)[0]
  const lx = box.x + box.w / 2
  const ly = fitsInside ? box.y + box.h / 2 : box.y - 4
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
      {showLabel && box.showLabel && (
        <text
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline={fitsInside ? 'middle' : 'auto'}
          fontSize={fontSize}
          fill="var(--color-ink-soft)"
          stroke={fitsInside ? undefined : 'var(--color-card)'}
          strokeWidth={fitsInside ? undefined : 3}
          paintOrder="stroke"
          // Counter-rotate so labels stay upright when the building is rotated.
          transform={theta ? `rotate(${-theta} ${lx} ${ly})` : undefined}
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
  { plan, unitSystem, furniture, showLabels = true, selectedRoomId, focusRoomId, onSelectRoom, doorFacing },
  ref,
) {
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const theta = planRotation(plan, doorFacing)
  const cx = bounds.w / 2
  const cy = bounds.h / 2
  const focus = focusRoomId ? plan.rooms.find((r) => r.id === focusRoomId)?.footprint : undefined
  const content = rotatedBounds(focus ?? bounds, cx, cy, theta)
  const showCompass = Boolean(doorFacing) && !focus
  const pad = focus ? FOCUS_PAD : showCompass ? COMPASS_PAD : PAD
  const vb = { x: content.x - pad, y: content.y - pad, w: content.w + pad * 2, h: content.h + pad * 2 }
  const dim = (roomId: string) => (focusRoomId && roomId !== focusRoomId ? 0.35 : 1)

  return (
    <svg ref={ref} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="h-auto max-h-full w-full" role="img" aria-label={`${plan.name} floor plan`}>
      {showCompass && (
        <g fontSize={11} fontWeight={700} fill="var(--color-accent-deep)" textAnchor="middle" dominantBaseline="middle" aria-hidden>
          <text x={vb.x + vb.w / 2} y={vb.y + pad / 2}>
            N
          </text>
          <text x={vb.x + vb.w / 2} y={vb.y + vb.h - pad / 2}>
            S
          </text>
          <text x={vb.x + pad / 2} y={vb.y + vb.h / 2}>
            W
          </text>
          <text x={vb.x + vb.w - pad / 2} y={vb.y + vb.h / 2}>
            E
          </text>
        </g>
      )}

      <g transform={theta ? `rotate(${theta} ${cx} ${cy})` : undefined}>
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

        {plan.fixtures?.map((box) => <Box key={box.id} box={box} showLabel={showLabels} theta={theta} />)}

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
                <Box box={box} showLabel={showLabels} theta={theta} />
              </g>
            )),
          )}

        {showLabels &&
          plan.rooms.map((room) => {
            const c = rectCenter(room.footprint)
            const visualW = theta % 180 === 0 ? room.footprint.w : room.footprint.h
            const visualH = theta % 180 === 0 ? room.footprint.h : room.footprint.w
            const narrow = Math.min(visualW, visualH) < NARROW_THRESHOLD_IN
            const tilt = narrow && visualW < visualH ? -90 : 0
            const netRotation = tilt - theta
            // Furniture hugs walls and "top" moves under rotation, so those labels go to the (usually clear) center.
            const nameY = narrow ? c.y : furniture || theta ? c.y - 7 : room.footprint.y + LABEL_TOP_OFFSET_IN
            const halo = { stroke: ROOM_TYPE_COLOR[room.type], strokeWidth: 4, strokeLinejoin: 'round' as const, paintOrder: 'stroke' }
            return (
              <g key={room.id} opacity={dim(room.id)} pointerEvents="none" transform={netRotation ? `rotate(${netRotation} ${c.x} ${c.y})` : undefined}>
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
      </g>
    </svg>
  )
})
