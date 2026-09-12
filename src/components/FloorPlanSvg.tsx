import { floorPlanBounds, floorPlanWalls, ROOM_TYPE_COLOR, type FloorPlan } from '@/lib/floorplan'
import { rectCenter } from '@/lib/geometry'
import { formatArea, sqInToSqFt } from '@/lib/units'

interface FloorPlanSvgProps {
  plan: FloorPlan
}

const WALL_COLOR = 'var(--color-wall)'
const WALL_WIDTH = 3.5
/** Rooms narrower than this (inches) get a compact, name-only label. */
const NARROW_THRESHOLD_IN = 72

export function FloorPlanSvg({ plan }: FloorPlanSvgProps) {
  const bounds = floorPlanBounds(plan)
  const walls = floorPlanWalls(plan)
  const pad = 24

  return (
    <svg
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

      {plan.rooms.map((room) => {
        const c = rectCenter(room.footprint)
        const narrow = Math.min(room.footprint.w, room.footprint.h) < NARROW_THRESHOLD_IN
        const rotate = narrow && room.footprint.w < room.footprint.h
        return (
          <g
            key={room.id}
            transform={rotate ? `rotate(-90 ${c.x} ${c.y})` : undefined}
          >
            <text
              x={c.x}
              y={narrow ? c.y : c.y - 6}
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
                y={c.y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--color-ink-soft)"
              >
                {formatArea(sqInToSqFt(room.footprint.w * room.footprint.h))}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
