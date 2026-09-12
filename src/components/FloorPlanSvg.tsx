import { forwardRef } from 'react'
import { floorPlanBounds, floorPlanWalls, ROOM_TYPE_COLOR, type FloorPlan } from '@/lib/floorplan'
import { rectCenter } from '@/lib/geometry'
import { formatAreaBySystem } from '@/lib/units'
import type { PlacedItem } from '@/lib/furniturePlacement'
import { useOnboardingStore, type CompassDirection } from '@/store/onboardingStore'

interface FloorPlanSvgProps {
  plan: FloorPlan
  /** Furniture boxes to draw on top, keyed by room id — omit to show the bare plan. */
  furniture?: Record<string, PlacedItem[]>
}

const WALL_COLOR = 'var(--color-wall)'
const WALL_WIDTH = 3.5
/** Rooms narrower than this (inches) get a compact, name-only label. */
const NARROW_THRESHOLD_IN = 72
/** Non-narrow room labels sit near the top so they never collide with furniture boxes below. */
const LABEL_TOP_OFFSET_IN = 18

/**
 * The compass paper never moves (N is always up, E right, S down, W left —
 * standard map convention). What rotates is the *building* — birchTwoBed's
 * front door is authored fixed on the west (left) wall, so to make it face
 * whatever direction the client actually said, we spin the whole drawing.
 */
const ANGLE_FOR: Record<CompassDirection, number> = { N: 0, E: 90, S: 180, W: 270 }

function rotationForDoorFacing(doorFacing: CompassDirection | null): number {
  if (!doorFacing) return 0
  return (((ANGLE_FOR[doorFacing] - ANGLE_FOR.W) % 360) + 360) % 360
}

export const FloorPlanSvg = forwardRef<SVGSVGElement, FloorPlanSvgProps>(function FloorPlanSvg(
  { plan, furniture },
  ref,
) {
  const unitSystem = useOnboardingStore((s) => s.unitSystem)
  const doorFacing = useOnboardingStore((s) => s.doorFacing)
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const pad = 30
  const theta = rotationForDoorFacing(doorFacing)
  const cx = bounds.w / 2
  const cy = bounds.h / 2
  const rotated = theta === 90 || theta === 270
  // The rotated content's bounding box swaps orientation at 90/270 — size the
  // viewBox to match so nothing gets clipped or left with lopsided margins.
  const viewW = rotated ? bounds.h : bounds.w
  const viewH = rotated ? bounds.w : bounds.h

  return (
    <svg
      ref={ref}
      viewBox={`${cx - viewW / 2 - pad} ${cy - viewH / 2 - pad} ${viewW + pad * 2} ${viewH + pad * 2}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${plan.name} floor plan`}
    >
      {/* Compass — fixed. The building rotates around it, not the other way around. */}
      <g fontSize={11} fontWeight={700} fill="var(--color-accent-deep)" textAnchor="middle">
        <text x={cx} y={cy - viewH / 2 - pad / 2} dominantBaseline="middle">
          N
        </text>
        <text x={cx} y={cy + viewH / 2 + pad / 2} dominantBaseline="middle">
          S
        </text>
        <text x={cx - viewW / 2 - pad / 2} y={cy} dominantBaseline="middle">
          W
        </text>
        <text x={cx + viewW / 2 + pad / 2} y={cy} dominantBaseline="middle">
          E
        </text>
      </g>

      <g transform={theta !== 0 ? `rotate(${theta} ${cx} ${cy})` : undefined}>
        {plan.rooms.map((room) => {
          const r = room.footprint
          return <rect key={room.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={ROOM_TYPE_COLOR[room.type]} />
        })}

        {walls.map((w, i) => (
          <line
            key={i}
            x1={w.x1}
            y1={w.y1}
            x2={w.x2}
            y2={w.y2}
            stroke={WALL_COLOR}
            strokeWidth={WALL_WIDTH}
            strokeLinecap="round"
          />
        ))}

        {/* Door gaps: paint over the wall line with the room color it opens into. */}
        {plan.doors?.map((door, i) => (
          <line
            key={i}
            x1={door.orientation === 'v' ? door.x : door.x}
            y1={door.orientation === 'v' ? door.y : door.y}
            x2={door.orientation === 'v' ? door.x : door.x + door.length}
            y2={door.orientation === 'v' ? door.y + door.length : door.y}
            stroke="var(--color-app)"
            strokeWidth={WALL_WIDTH + 1}
          />
        ))}

        {/* Outer envelope, drawn a touch thicker. */}
        <rect x={0} y={0} width={bounds.w} height={bounds.h} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_WIDTH + 1.5} />

        {furniture &&
          plan.rooms.flatMap((room) =>
            (furniture[room.id] ?? []).map((item) => (
              <g key={`${room.id}-${item.id}`}>
                <rect
                  x={item.x}
                  y={item.y}
                  width={item.w}
                  height={item.h}
                  rx={3}
                  fill="var(--color-card)"
                  stroke={WALL_COLOR}
                  strokeWidth={1.25}
                />
                {item.showLabel && (
                  <text
                    x={item.labelX}
                    y={item.labelY}
                    textAnchor={item.labelAnchor}
                    dominantBaseline={item.labelAnchor === 'middle' ? 'auto' : 'middle'}
                    fontSize={8.5}
                    fill="var(--color-ink-soft)"
                    // Counter-rotate so labels stay upright even though the building underneath is rotated.
                    transform={theta !== 0 ? `rotate(${-theta} ${item.labelX} ${item.labelY})` : undefined}
                  >
                    {item.label}
                  </text>
                )}
              </g>
            )),
          )}

        {plan.rooms.map((room) => {
          const c = rectCenter(room.footprint)
          // "Narrow" has to look at the room's *visual* (post-rotation) shape — at
          // theta 90/270 a room's on-screen width/height are swapped from its
          // authored footprint, so whether its label needs to run vertically to
          // fit is a different answer than it would be unrotated.
          const visualW = rotated ? room.footprint.h : room.footprint.w
          const visualH = rotated ? room.footprint.w : room.footprint.h
          const narrow = Math.min(visualW, visualH) < NARROW_THRESHOLD_IN
          const desiredScreenTilt = narrow && visualW < visualH ? -90 : 0
          const nameY = narrow ? c.y : room.footprint.y + LABEL_TOP_OFFSET_IN
          const netRotation = desiredScreenTilt - theta
          return (
            <g key={room.id} transform={netRotation !== 0 ? `rotate(${netRotation} ${c.x} ${c.y})` : undefined}>
              <text
                x={c.x}
                y={nameY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={narrow ? 11 : 15}
                fontWeight={600}
                fontFamily="var(--font-serif)"
                fill="var(--color-ink)"
              >
                {room.name}
              </text>
              {!narrow && (
                <text
                  x={c.x}
                  y={nameY + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="var(--color-ink-soft)"
                >
                  {formatAreaBySystem(room.footprint.w * room.footprint.h, unitSystem)}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
})
