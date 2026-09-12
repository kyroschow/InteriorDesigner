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

const COMPASS_ORDER: CompassDirection[] = ['N', 'E', 'S', 'W']

/**
 * The plan's front door is fixed on its left/west wall (see birchTwoBed.ts).
 * When the client told us which way the real door faces, rotate the compass
 * so that wall matches — otherwise fall back to the standard map convention
 * (north at the top).
 */
function compassSides(doorFacing: CompassDirection | null) {
  if (!doorFacing) return { top: 'N', right: 'E', bottom: 'S', left: 'W' } as const
  const i = COMPASS_ORDER.indexOf(doorFacing)
  return {
    left: doorFacing,
    top: COMPASS_ORDER[(i + 1) % 4],
    right: COMPASS_ORDER[(i + 2) % 4],
    bottom: COMPASS_ORDER[(i + 3) % 4],
  }
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
  const compass = compassSides(doorFacing)

  return (
    <svg
      ref={ref}
      viewBox={`${-pad} ${-pad} ${bounds.w + pad * 2} ${bounds.h + pad * 2}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${plan.name} floor plan`}
    >
      {plan.rooms.map((room) => {
        const r = room.footprint
        return (
          <rect
            key={room.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={ROOM_TYPE_COLOR[room.type]}
          />
        )
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
      <rect
        x={0}
        y={0}
        width={bounds.w}
        height={bounds.h}
        fill="none"
        stroke={WALL_COLOR}
        strokeWidth={WALL_WIDTH + 1.5}
      />

      {/* Compass — rotated so the actual front door (fixed on the left wall) matches what the client told us. */}
      <g fontSize={11} fontWeight={700} fill="var(--color-accent-deep)" textAnchor="middle">
        <text x={bounds.w / 2} y={-pad / 2} dominantBaseline="middle">
          {compass.top}
        </text>
        <text x={bounds.w / 2} y={bounds.h + pad / 2} dominantBaseline="middle">
          {compass.bottom}
        </text>
        <text x={-pad / 2} y={bounds.h / 2} dominantBaseline="middle">
          {compass.left}
        </text>
        <text x={bounds.w + pad / 2} y={bounds.h / 2} dominantBaseline="middle">
          {compass.right}
        </text>
      </g>

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
                >
                  {item.label}
                </text>
              )}
            </g>
          )),
        )}

      {plan.rooms.map((room) => {
        const c = rectCenter(room.footprint)
        const narrow = Math.min(room.footprint.w, room.footprint.h) < NARROW_THRESHOLD_IN
        const rotate = narrow && room.footprint.w < room.footprint.h
        const nameY = narrow ? c.y : room.footprint.y + LABEL_TOP_OFFSET_IN
        return (
          <g key={room.id} transform={rotate ? `rotate(-90 ${c.x} ${c.y})` : undefined}>
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
    </svg>
  )
})
