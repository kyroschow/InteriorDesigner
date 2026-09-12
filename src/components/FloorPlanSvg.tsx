import { forwardRef } from 'react'
import { floorPlanBounds, floorPlanWalls, ROOM_TYPE_COLOR, type FloorPlan } from '@/lib/floorplan'
import { rectCenter } from '@/lib/geometry'
import { formatAreaBySystem } from '@/lib/units'
import type { PlacedItem } from '@/lib/furniturePlacement'
import { useOnboardingStore } from '@/store/onboardingStore'

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

export const FloorPlanSvg = forwardRef<SVGSVGElement, FloorPlanSvgProps>(function FloorPlanSvg(
  { plan, furniture },
  ref,
) {
  const unitSystem = useOnboardingStore((s) => s.unitSystem)
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const pad = 24

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
