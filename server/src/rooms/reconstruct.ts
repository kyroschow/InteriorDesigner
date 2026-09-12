import type {
  Floor,
  FloorOpening,
  Opening,
  PlacedObject,
  Room,
  RoomDefinition,
  RoomTransform,
  Wall,
  WallSide,
} from '../domain/types.ts'
import { DEMO_OPENINGS, FOUR_ROOM_V1 } from '../fixtures/fourRoomV1.ts'
import type { ErrorDetail } from '../http/errors.ts'
import { type Rect, area, intersects, m, mm } from '../geometry/rect.ts'

const SHELL: Rect = { x0: 0, y0: 0, x1: mm(FOUR_ROOM_V1.widthM), y1: mm(FOUR_ROOM_V1.depthM) }

const isMillimeterPrecise = (v: number) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6

/** Room size in mm from a local polygon, or null if it is not an origin-anchored axis-aligned rectangle. */
export function rectangleSize(polygon: { x: number; y: number }[]): { w: number; d: number } | null {
  if (polygon.length !== 4) return null
  const xs = polygon.map((p) => mm(p.x))
  const ys = polygon.map((p) => mm(p.y))
  const w = Math.max(...xs)
  const d = Math.max(...ys)
  if (Math.min(...xs) !== 0 || Math.min(...ys) !== 0 || w <= 0 || d <= 0) return null
  const corners = new Set(['0,0', `${w},0`, `${w},${d}`, `0,${d}`])
  for (let i = 0; i < 4; i++) corners.delete(`${xs[i]},${ys[i]}`)
  return corners.size === 0 ? { w, d } : null
}

interface PlacedRoom {
  def: RoomDefinition
  floorRect: Rect
}

function placeRooms(rooms: RoomDefinition[], transforms: RoomTransform[]): PlacedRoom[] {
  return rooms.map((def) => {
    const size = rectangleSize(def.polygon)!
    const t = transforms.find((tr) => tr.roomId === def.id)!
    const x0 = mm(t.origin.x)
    const y0 = mm(t.origin.y)
    return { def, floorRect: { x0, y0, x1: x0 + size.w, y1: y0 + size.d } }
  })
}

/** Which wall of a room (if any) a floor opening lies on, with its local offset in mm. */
function attachOpening(o: FloorOpening, r: Rect): { side: WallSide; offset: number; width: number } | null {
  const ax = mm(o.a.x)
  const ay = mm(o.a.y)
  const bx = mm(o.b.x)
  const by = mm(o.b.y)
  if (ay === by) {
    const s0 = Math.min(ax, bx)
    const s1 = Math.max(ax, bx)
    if (s0 < r.x0 || s1 > r.x1) return null
    if (ay === r.y0) return { side: 'bottom', offset: s0 - r.x0, width: s1 - s0 }
    if (ay === r.y1) return { side: 'top', offset: s0 - r.x0, width: s1 - s0 }
    return null
  }
  const s0 = Math.min(ay, by)
  const s1 = Math.max(ay, by)
  if (s0 < r.y0 || s1 > r.y1) return null
  if (ax === r.x0) return { side: 'left', offset: s0 - r.y0, width: s1 - s0 }
  if (ax === r.x1) return { side: 'right', offset: s0 - r.y0, width: s1 - s0 }
  return null
}

function isExteriorWall(side: WallSide, r: Rect): boolean {
  switch (side) {
    case 'bottom':
      return r.y0 === SHELL.y0
    case 'top':
      return r.y1 === SHELL.y1
    case 'left':
      return r.x0 === SHELL.x0
    case 'right':
      return r.x1 === SHELL.x1
  }
}

/**
 * Semantic validation for PUT rooms: rectangles at the origin that exactly tile
 * the fixed shell, with every demo opening still on a valid wall.
 */
export function validateRooms(
  rooms: RoomDefinition[],
  transforms: RoomTransform[],
  currentRoomIds: string[],
  openings: FloorOpening[] = DEMO_OPENINGS,
): ErrorDetail[] {
  const details: ErrorDetail[] = []
  const ids = rooms.map((r) => r.id)
  if (new Set(ids).size !== ids.length) details.push({ path: 'rooms', code: 'DUPLICATE_ROOM_ID' })
  const expected = [...currentRoomIds].sort().join(',')
  if ([...ids].sort().join(',') !== expected) {
    details.push({ path: 'rooms', code: 'ROOM_SET_MISMATCH', message: `Room IDs must be exactly: ${currentRoomIds.join(', ')}.` })
  }
  const tIds = transforms.map((t) => t.roomId)
  if ([...tIds].sort().join(',') !== expected || new Set(tIds).size !== tIds.length) {
    details.push({ path: 'roomTransforms', code: 'TRANSFORM_SET_MISMATCH', message: 'Provide exactly one transform per room.' })
  }

  rooms.forEach((room, i) => {
    const precise = room.polygon.every((p) => isMillimeterPrecise(p.x) && isMillimeterPrecise(p.y))
    if (!precise) details.push({ path: `rooms[${i}].polygon`, code: 'PRECISION_EXCEEDED', roomId: room.id })
    else if (!rectangleSize(room.polygon)) {
      details.push({
        path: `rooms[${i}].polygon`,
        code: 'NOT_RECTANGLE',
        roomId: room.id,
        message: 'Polygon must be an axis-aligned rectangle with its min corner at (0,0).',
      })
    }
  })
  transforms.forEach((t, i) => {
    if (!isMillimeterPrecise(t.origin.x) || !isMillimeterPrecise(t.origin.y)) {
      details.push({ path: `roomTransforms[${i}].origin`, code: 'PRECISION_EXCEEDED', roomId: t.roomId })
    }
  })
  if (details.length > 0) return details

  const placed = placeRooms(rooms, transforms)
  let total = 0
  placed.forEach((p, i) => {
    total += area(p.floorRect)
    if (p.floorRect.x0 < SHELL.x0 || p.floorRect.y0 < SHELL.y0 || p.floorRect.x1 > SHELL.x1 || p.floorRect.y1 > SHELL.y1) {
      details.push({ path: `rooms[${i}]`, code: 'OUTSIDE_SHELL', roomId: p.def.id })
    }
    for (let j = i + 1; j < placed.length; j++) {
      if (intersects(p.floorRect, placed[j].floorRect)) {
        details.push({ path: `rooms[${i}]`, code: 'ROOMS_OVERLAP', roomId: p.def.id, otherRoomId: placed[j].def.id })
      }
    }
  })
  if (details.length === 0 && total !== area(SHELL)) {
    details.push({ path: 'rooms', code: 'SHELL_NOT_COVERED', message: 'Rooms must exactly cover the 10 m x 8 m floor.' })
  }
  if (details.length > 0) return details

  for (const o of openings) {
    for (const roomId of o.connects) {
      if (roomId === 'exterior') continue
      const p = placed.find((pr) => pr.def.id === roomId)
      const attached = p && attachOpening(o, p.floorRect)
      if (!attached) {
        details.push({
          path: 'rooms',
          code: 'OPENING_INVALID',
          openingId: o.id,
          roomId,
          message: `${o.id} would no longer lie on a wall of ${roomId}; fixed openings cannot move.`,
        })
      } else if (o.connects.includes('exterior') && !isExteriorWall(attached.side, p.floorRect)) {
        details.push({ path: 'rooms', code: 'OPENING_INVALID', openingId: o.id, roomId, message: `${o.id} must stay on an exterior wall.` })
      }
    }
  }
  return details
}

function buildWalls(w: number, d: number, floorRect: Rect): Wall[] {
  const walls: [WallSide, { x: number; y: number }, { x: number; y: number }][] = [
    ['bottom', { x: 0, y: 0 }, { x: w, y: 0 }],
    ['right', { x: w, y: 0 }, { x: w, y: d }],
    ['top', { x: w, y: d }, { x: 0, y: d }],
    ['left', { x: 0, y: d }, { x: 0, y: 0 }],
  ]
  return walls.map(([side, a, b]) => ({
    id: `wall-${side}` as const,
    side,
    a: { x: m(a.x), y: m(a.y) },
    b: { x: m(b.x), y: m(b.y) },
    length_m: m(side === 'bottom' || side === 'top' ? w : d),
    is_exterior: isExteriorWall(side, floorRect),
  }))
}

/** Build the canonical floor scene. Assumes rooms already passed validateRooms. */
export function buildFloor(
  rooms: RoomDefinition[],
  transforms: RoomTransform[],
  objects: PlacedObject[] = [],
  roomOfObject: (o: PlacedObject) => string | undefined = () => undefined,
  openings: FloorOpening[] = DEMO_OPENINGS,
): Floor {
  const placed = placeRooms(rooms, transforms)
  const sceneRooms: Room[] = placed.map(({ def, floorRect }) => {
    const w = floorRect.x1 - floorRect.x0
    const d = floorRect.y1 - floorRect.y0
    const roomOpenings: Opening[] = []
    for (const o of openings) {
      if (!o.connects.includes(def.id)) continue
      const attached = attachOpening(o, floorRect)
      if (!attached) continue
      roomOpenings.push({
        id: o.id,
        kind: o.kind,
        wall_id: `wall-${attached.side}`,
        offset_m: m(attached.offset),
        width_m: m(attached.width),
        height_m: o.height_m,
        sill_m: o.sill_m,
        swing: o.kind !== 'door' ? 'none' : o.swingsInto === def.id ? 'into_room' : 'away',
        leads_to: o.connects.find((c) => c !== def.id) ?? 'exterior',
      })
    }
    return {
      id: def.id,
      label: def.label,
      type: def.type,
      polygon: def.polygon.map((p) => ({ x: m(mm(p.x)), y: m(mm(p.y)) })),
      ceiling_height_m: FOUR_ROOM_V1.ceilingHeightM,
      area_m2: Math.round((w * d) / 1000) / 1000,
      walls: buildWalls(w, d, floorRect),
      openings: roomOpenings,
      objects: objects.filter((o) => roomOfObject(o) === def.id),
    }
  })
  return {
    id: 'floor-0',
    level: 0,
    height_m: FOUR_ROOM_V1.ceilingHeightM,
    width_m: FOUR_ROOM_V1.widthM,
    depth_m: FOUR_ROOM_V1.depthM,
    rooms: sceneRooms,
    stairs: [],
  }
}
