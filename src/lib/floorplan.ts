/**
 * Renderer-facing plan model: rectangular rooms in inches, plan space (+y
 * down). Built from the API scene by lib/sceneCoordinates.ts — never stored.
 */
import { type Rect, rectBottom, rectRight } from './geometry'

export type RoomType = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'hall'

export interface RoomSpec {
  id: string
  name: string
  type: RoomType
  /** Footprint in inches. */
  footprint: Rect
  /** Ids of rooms this one shares no wall with (open-plan boundary). */
  openTo?: string[]
}

/** A gap cut into a wall — a straight segment, no swing arc. */
export interface Door {
  x: number
  y: number
  /** Length of the gap in inches, running along the wall. */
  length: number
  orientation: 'h' | 'v'
  kind?: 'door' | 'doorway' | 'window'
}

/** An axis-aligned footprint (furniture or fixed fixture) with its front edge marked. */
export interface PlanBox {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  front: 'top' | 'bottom' | 'left' | 'right'
  fixed: boolean
  /** False for repeats of the same product in a room — repeated labels crowd each other. */
  showLabel: boolean
}

export interface FloorPlan {
  id: string
  name: string
  rooms: RoomSpec[]
  doors?: Door[]
  fixtures?: PlanBox[]
}

/** Existing CSS room-fill tokens, keyed by room type. */
export const ROOM_TYPE_COLOR: Record<RoomType, string> = {
  living: 'var(--color-room-living)',
  kitchen: 'var(--color-room-utility)',
  bedroom: 'var(--color-room-sleep)',
  bathroom: 'var(--color-room-bath)',
  hall: 'var(--color-room-circulation)',
}

export function roomsOpenToEachOther(a: RoomSpec, b: RoomSpec): boolean {
  return Boolean(a.openTo?.includes(b.id) || b.openTo?.includes(a.id))
}

export interface WallSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** The segment two touching rooms share, if any — used to find open-plan boundaries. */
function sharedEdge(a: RoomSpec, b: RoomSpec): WallSegment | null {
  const ar = a.footprint
  const br = b.footprint
  const tolerance = 1
  if (Math.abs(rectRight(ar) - br.x) < tolerance || Math.abs(rectRight(br) - ar.x) < tolerance) {
    const y0 = Math.max(ar.y, br.y)
    const y1 = Math.min(rectBottom(ar), rectBottom(br))
    if (y1 > y0) {
      const x = Math.abs(rectRight(ar) - br.x) < tolerance ? rectRight(ar) : rectRight(br)
      return { x1: x, y1: y0, x2: x, y2: y1 }
    }
  }
  if (Math.abs(rectBottom(ar) - br.y) < tolerance || Math.abs(rectBottom(br) - ar.y) < tolerance) {
    const x0 = Math.max(ar.x, br.x)
    const x1 = Math.min(rectRight(ar), rectRight(br))
    if (x1 > x0) {
      const y = Math.abs(rectBottom(ar) - br.y) < tolerance ? rectBottom(ar) : rectBottom(br)
      return { x1: x0, y1: y, x2: x1, y2: y }
    }
  }
  return null
}

/** [s,e] minus every overlapping cut, e.g. subtractInterval(0, 18, [[14, 18]]) -> [[0, 14]]. */
function subtractIntervals(s: number, e: number, cuts: Array<[number, number]>): Array<[number, number]> {
  const clipped = cuts
    .map(([a, b]): [number, number] => [Math.max(a, s), Math.min(b, e)])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0])
  const remaining: Array<[number, number]> = []
  let cursor = s
  for (const [a, b] of clipped) {
    if (a > cursor) remaining.push([cursor, a])
    cursor = Math.max(cursor, b)
  }
  if (cursor < e) remaining.push([cursor, e])
  return remaining
}

/**
 * Wall lines to draw: every room edge, minus whichever portions are shared
 * with a room it's marked open to. Shared non-open edges get drawn once per
 * room (harmless — same line twice) rather than deduped, to keep this simple.
 */
export function floorPlanWalls(plan: FloorPlan): WallSegment[] {
  const openSkips: WallSegment[] = []
  for (let i = 0; i < plan.rooms.length; i++) {
    for (let j = i + 1; j < plan.rooms.length; j++) {
      const a = plan.rooms[i]
      const b = plan.rooms[j]
      if (roomsOpenToEachOther(a, b)) {
        const seg = sharedEdge(a, b)
        if (seg) openSkips.push(seg)
      }
    }
  }

  const cutsFor = (orient: 'h' | 'v', coord: number): Array<[number, number]> =>
    openSkips
      .filter((seg) =>
        orient === 'v' ? seg.x1 === seg.x2 && Math.abs(seg.x1 - coord) < 1 : seg.y1 === seg.y2 && Math.abs(seg.y1 - coord) < 1,
      )
      .map((seg) => (orient === 'v' ? [seg.y1, seg.y2] : [seg.x1, seg.x2]))

  const walls: WallSegment[] = []
  for (const room of plan.rooms) {
    const r = room.footprint
    const edges: Array<{ orient: 'h' | 'v'; coord: number; s: number; e: number }> = [
      { orient: 'h', coord: r.y, s: r.x, e: rectRight(r) },
      { orient: 'h', coord: rectBottom(r), s: r.x, e: rectRight(r) },
      { orient: 'v', coord: r.x, s: r.y, e: rectBottom(r) },
      { orient: 'v', coord: rectRight(r), s: r.y, e: rectBottom(r) },
    ]
    for (const edge of edges) {
      const pieces = subtractIntervals(edge.s, edge.e, cutsFor(edge.orient, edge.coord))
      for (const [s, e] of pieces) {
        walls.push(
          edge.orient === 'h' ? { x1: s, y1: edge.coord, x2: e, y2: edge.coord } : { x1: edge.coord, y1: s, x2: edge.coord, y2: e },
        )
      }
    }
  }
  return walls
}

/** Union bounding box of every room's footprint. */
export function floorPlanBounds(plan: FloorPlan): Rect {
  let maxX = 0
  let maxY = 0
  for (const room of plan.rooms) {
    maxX = Math.max(maxX, rectRight(room.footprint))
    maxY = Math.max(maxY, rectBottom(room.footprint))
  }
  return { x: 0, y: 0, w: maxX, h: maxY }
}
