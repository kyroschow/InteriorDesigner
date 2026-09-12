/**
 * The `four-room-v1` demo shell (interior-workspace-draft.md, "Demo fixture"):
 * a 10 m × 8 m floor, 2.7 m ceilings, four rectangular rooms. Openings and
 * kitchen/bath fixtures are fixed demo data stored in floor space; every
 * read reconstructs the canonical per-room scene from the current partitions.
 *
 * Floor space is meters, Y up, origin at the shell's south-west corner.
 */
import type { ApiErrorDetail, Floor, Opening, Point, Room, RoomEdit, RoomTransform, RoomType, SceneObject, Wall } from '@/types/interior'

export const FOOTPRINT_M = { w: 10, d: 8 }
export const CEILING_HEIGHT_M = 2.7
const EPS = 1e-6
/** Openings must keep this much wall on either side after a partition edit. */
const OPENING_END_MARGIN_M = 0.1

export const round3 = (n: number) => Math.round(n * 1000) / 1000

const rectPolygon = (w: number, d: number): Point[] => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: d },
  { x: 0, y: d },
]

export const DEMO_ROOMS: RoomEdit[] = [
  { id: 'room-1', label: 'Living room', type: 'living_room', polygon: rectPolygon(6, 4) },
  { id: 'room-2', label: 'Kitchen', type: 'kitchen', polygon: rectPolygon(4, 4) },
  { id: 'room-3', label: 'Bedroom', type: 'bedroom_primary', polygon: rectPolygon(6, 4) },
  { id: 'room-4', label: 'Bathroom', type: 'bathroom_full', polygon: rectPolygon(4, 4) },
]

export const DEMO_TRANSFORMS: RoomTransform[] = [
  { roomId: 'room-1', origin: { x: 0, y: 0 } },
  { roomId: 'room-2', origin: { x: 6, y: 0 } },
  { roomId: 'room-3', origin: { x: 0, y: 4 } },
  { roomId: 'room-4', origin: { x: 6, y: 4 } },
]

type Edge = 's' | 'e' | 'n' | 'w'

interface FixedOpening {
  id: string
  label: string
  kind: Opening['kind']
  /** 'h' runs along X (on a south/north wall), 'v' along Y. */
  orientation: 'h' | 'v'
  /** Floor-space extent along the wall; never moved by partition edits. */
  start: number
  end: number
  /** Two rooms for an interior opening; one room plus a shell edge for an exterior one. */
  rooms: [string, string] | [string]
  exteriorEdge?: Edge
  swingInto: string | null
  height_m: number
  sill_m: number
  is_egress: boolean
}

interface FixedFixture {
  id: string
  roomId: string
  type: string
  label: string
  /** Floor-space footprint center. */
  cx: number
  cy: number
  w: number
  d: number
  h: number
  rot: 0 | 90 | 180 | 270
  materials: string[]
  hex: string
}

const OPENINGS: FixedOpening[] = [
  { id: 'open-entry', label: 'Entry door', kind: 'door', orientation: 'h', start: 2, end: 2.9, rooms: ['room-1'], exteriorEdge: 's', swingInto: 'room-1', height_m: 2.03, sill_m: 0, is_egress: true },
  { id: 'open-living-kitchen', label: 'Kitchen doorway', kind: 'doorway', orientation: 'v', start: 1.2, end: 2.2, rooms: ['room-1', 'room-2'], swingInto: null, height_m: 2.1, sill_m: 0, is_egress: false },
  { id: 'open-living-bedroom', label: 'Bedroom door', kind: 'door', orientation: 'h', start: 1, end: 1.9, rooms: ['room-1', 'room-3'], swingInto: 'room-3', height_m: 2.03, sill_m: 0, is_egress: false },
  { id: 'open-bedroom-bathroom', label: 'Bathroom door', kind: 'door', orientation: 'v', start: 6.9, end: 7.7, rooms: ['room-3', 'room-4'], swingInto: 'room-4', height_m: 2.03, sill_m: 0, is_egress: false },
  { id: 'win-living', label: 'Living room window', kind: 'window', orientation: 'h', start: 3.8, end: 5.3, rooms: ['room-1'], exteriorEdge: 's', swingInto: null, height_m: 1.4, sill_m: 0.8, is_egress: false },
  { id: 'win-kitchen', label: 'Kitchen window', kind: 'window', orientation: 'v', start: 1.2, end: 2.2, rooms: ['room-2'], exteriorEdge: 'e', swingInto: null, height_m: 1.1, sill_m: 1.05, is_egress: false },
  { id: 'win-bedroom', label: 'Bedroom window', kind: 'window', orientation: 'h', start: 2, end: 3.6, rooms: ['room-3'], exteriorEdge: 'n', swingInto: null, height_m: 1.4, sill_m: 0.8, is_egress: true },
  { id: 'win-bathroom', label: 'Bathroom window', kind: 'window', orientation: 'h', start: 7.6, end: 8.2, rooms: ['room-4'], exteriorEdge: 'n', swingInto: null, height_m: 0.6, sill_m: 1.5, is_egress: false },
]

const FIXTURES: FixedFixture[] = [
  { id: 'fix-kitchen-counter', roomId: 'room-2', type: 'kitchen.counter.run_with_sink_and_range', label: 'Counter, sink & range', cx: 8.6, cy: 0.3, w: 2.8, d: 0.6, h: 0.9, rot: 0, materials: ['laminate'], hex: '#e5e7eb' },
  { id: 'fix-fridge', roomId: 'room-2', type: 'appliance.refrigerator', label: 'Fridge', cx: 9.65, cy: 2.975, w: 0.75, d: 0.7, h: 1.8, rot: 270, materials: ['steel'], hex: '#d1d5db' },
  { id: 'fix-shower', roomId: 'room-4', type: 'bath.shower.stall', label: 'Shower', cx: 9.55, cy: 5.45, w: 0.9, d: 0.9, h: 2.1, rot: 270, materials: ['ceramic', 'glass'], hex: '#e0f2fe' },
  { id: 'fix-toilet', roomId: 'room-4', type: 'bath.toilet.standard', label: 'Toilet', cx: 9.65, cy: 6.8, w: 0.4, d: 0.7, h: 0.8, rot: 270, materials: ['ceramic'], hex: '#f8fafc' },
]

export interface RectM {
  x: number
  y: number
  w: number
  d: number
}

/** Plan extents of a footprint at a 90° rotation: width/depth swap at 90 and 270. */
export const planExtents = (w: number, d: number, rot: number) => (rot % 180 === 0 ? { w, d } : { w: d, d: w })

export function polygonSize(polygon: Point[]): { w: number; d: number } {
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...ys) - Math.min(...ys) }
}

export function floorRects(rooms: RoomEdit[], transforms: RoomTransform[]): Map<string, RectM> {
  const out = new Map<string, RectM>()
  for (const room of rooms) {
    const origin = transforms.find((t) => t.roomId === room.id)?.origin ?? { x: 0, y: 0 }
    const { w, d } = polygonSize(room.polygon)
    out.set(room.id, { x: origin.x, y: origin.y, w, d })
  }
  return out
}

const near = (a: number, b: number) => Math.abs(a - b) < EPS

/** Floor-space coordinate perpendicular to the wall an opening sits in, or null if its rooms no longer share/own that wall. */
function openingWallCoordinate(opening: FixedOpening, rects: Map<string, RectM>): number | null {
  const a = rects.get(opening.rooms[0])
  if (!a) return null
  const withinSpan = (lo: number, hi: number) =>
    opening.start >= lo + OPENING_END_MARGIN_M - EPS && opening.end <= hi - OPENING_END_MARGIN_M + EPS

  if (opening.exteriorEdge) {
    const edge = opening.exteriorEdge
    if (edge === 's') return near(a.y, 0) && withinSpan(a.x, a.x + a.w) ? 0 : null
    if (edge === 'n') return near(a.y + a.d, FOOTPRINT_M.d) && withinSpan(a.x, a.x + a.w) ? FOOTPRINT_M.d : null
    if (edge === 'w') return near(a.x, 0) && withinSpan(a.y, a.y + a.d) ? 0 : null
    return near(a.x + a.w, FOOTPRINT_M.w) && withinSpan(a.y, a.y + a.d) ? FOOTPRINT_M.w : null
  }

  const b = rects.get(opening.rooms[1] as string)
  if (!b) return null
  if (opening.orientation === 'v') {
    const x = near(a.x + a.w, b.x) ? b.x : near(b.x + b.w, a.x) ? a.x : null
    if (x === null) return null
    return withinSpan(Math.max(a.y, b.y), Math.min(a.y + a.d, b.y + b.d)) ? x : null
  }
  const y = near(a.y + a.d, b.y) ? b.y : near(b.y + b.d, a.y) ? a.y : null
  if (y === null) return null
  return withinSpan(Math.max(a.x, b.x), Math.min(a.x + a.w, b.x + b.w)) ? y : null
}

function fixtureRect(f: FixedFixture): RectM {
  const { w, d } = planExtents(f.w, f.d, f.rot)
  return { x: f.cx - w / 2, y: f.cy - d / 2, w, d }
}

const rectInside = (inner: RectM, outer: RectM) =>
  inner.x >= outer.x - EPS && inner.y >= outer.y - EPS && inner.x + inner.w <= outer.x + outer.w + EPS && inner.y + inner.d <= outer.y + outer.d + EPS

const rectsOverlap = (a: RectM, b: RectM) =>
  a.x + EPS < b.x + b.w && b.x + EPS < a.x + a.w && a.y + EPS < b.y + b.d && b.y + EPS < a.y + a.d

const hasThreeDecimals = (n: number) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6

/**
 * Semantic checks for `PUT /rooms` beyond JSON Schema: same room set, one
 * transform per room, rectangles at local (0,0), exact tiling of the fixed
 * shell, 3-decimal precision, and fixed openings/fixtures still valid.
 */
export function validateRoomGeometry(currentIds: string[], rooms: RoomEdit[], transforms: RoomTransform[]): ApiErrorDetail[] {
  const errors: ApiErrorDetail[] = []
  const ids = rooms.map((r) => r.id)
  if (new Set(ids).size !== ids.length) errors.push({ path: 'rooms', code: 'DUPLICATE_ROOM_ID', message: 'Room ids must be unique.' })
  const sameSet = ids.length === currentIds.length && currentIds.every((id) => ids.includes(id))
  if (!sameSet) errors.push({ path: 'rooms', code: 'ROOM_SET_MISMATCH', message: `Rooms must be exactly ${currentIds.join(', ')}.` })

  transforms.forEach((t, i) => {
    if (!ids.includes(t.roomId)) errors.push({ path: `roomTransforms[${i}].roomId`, code: 'UNKNOWN_ROOM', roomId: t.roomId, message: 'No such room.' })
  })
  for (const id of ids) {
    const count = transforms.filter((t) => t.roomId === id).length
    if (count !== 1) errors.push({ path: 'roomTransforms', code: 'TRANSFORM_MISMATCH', roomId: id, message: 'Each room needs exactly one transform.' })
  }

  rooms.forEach((room, i) => {
    const pts = room.polygon
    const path = `rooms[${i}].polygon`
    if ([...pts.flatMap((p) => [p.x, p.y])].some((n) => !hasThreeDecimals(n))) {
      errors.push({ path, code: 'PRECISION', roomId: room.id, message: 'Coordinates are limited to three decimals (millimeters).' })
    }
    const xs = [...new Set(pts.map((p) => p.x))]
    const ys = [...new Set(pts.map((p) => p.y))]
    const axisAligned = pts.every((p, k) => {
      const q = pts[(k + 1) % pts.length]
      return (p.x === q.x) !== (p.y === q.y)
    })
    const rectangle = xs.length === 2 && ys.length === 2 && axisAligned && new Set(pts.map((p) => `${p.x},${p.y}`)).size === 4
    if (!rectangle) {
      errors.push({ path, code: 'NOT_A_RECTANGLE', roomId: room.id, message: 'Polygon must be a non-degenerate axis-aligned rectangle.' })
    } else if (Math.min(...xs) !== 0 || Math.min(...ys) !== 0) {
      errors.push({ path, code: 'LOCAL_ORIGIN', roomId: room.id, message: 'Room-local polygons start at (0, 0).' })
    }
  })
  transforms.forEach((t, i) => {
    if (!hasThreeDecimals(t.origin.x) || !hasThreeDecimals(t.origin.y)) {
      errors.push({ path: `roomTransforms[${i}].origin`, code: 'PRECISION', roomId: t.roomId, message: 'Coordinates are limited to three decimals.' })
    }
  })
  if (errors.length) return errors

  const rects = floorRects(rooms, transforms)
  const shell: RectM = { x: 0, y: 0, ...FOOTPRINT_M }
  let area = 0
  for (const [id, r] of rects) {
    area += r.w * r.d
    if (!rectInside(r, shell)) errors.push({ path: 'roomTransforms', code: 'OUTSIDE_SHELL', roomId: id, message: 'Room extends outside the fixed 10 m × 8 m shell.' })
  }
  const list = [...rects.entries()]
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (rectsOverlap(list[i][1], list[j][1])) {
        errors.push({ path: 'roomTransforms', code: 'ROOMS_OVERLAP', roomId: list[i][0], message: `Overlaps ${list[j][0]}.` })
      }
    }
  }
  if (!errors.length && Math.abs(area - FOOTPRINT_M.w * FOOTPRINT_M.d) > 1e-4) {
    errors.push({ path: 'rooms', code: 'SHELL_NOT_TILED', message: 'Rooms must exactly fill the shell with no gaps.' })
  }
  if (errors.length) return errors

  for (const opening of OPENINGS) {
    if (openingWallCoordinate(opening, rects) === null) {
      errors.push({
        path: 'rooms',
        code: 'FIXED_ELEMENT_INVALID',
        roomId: opening.rooms[0],
        message: `${opening.label} would no longer sit on a wall of ${opening.rooms.join(' and ')}. Fixed openings are not moved automatically.`,
      })
    }
  }
  for (const fixture of FIXTURES) {
    const room = rects.get(fixture.roomId)
    if (room && !rectInside(fixtureRect(fixture), room)) {
      errors.push({ path: 'rooms', code: 'FIXED_ELEMENT_INVALID', roomId: fixture.roomId, message: `${fixture.label} would no longer fit inside its room.` })
    }
  }
  return errors
}

const WALL_ORDER: Edge[] = ['s', 'e', 'n', 'w']

function localWalls(roomId: string, w: number, d: number, rect: RectM): Wall[] {
  const corners: Record<Edge, [Point, Point]> = {
    s: [{ x: 0, y: 0 }, { x: w, y: 0 }],
    e: [{ x: w, y: 0 }, { x: w, y: d }],
    n: [{ x: w, y: d }, { x: 0, y: d }],
    w: [{ x: 0, y: d }, { x: 0, y: 0 }],
  }
  const exterior: Record<Edge, boolean> = {
    s: near(rect.y, 0),
    e: near(rect.x + rect.w, FOOTPRINT_M.w),
    n: near(rect.y + rect.d, FOOTPRINT_M.d),
    w: near(rect.x, 0),
  }
  return WALL_ORDER.map((edge) => ({
    id: `${roomId}-wall-${edge}`,
    a: corners[edge][0],
    b: corners[edge][1],
    thickness_m: exterior[edge] ? 0.2 : 0.1,
    is_exterior: exterior[edge],
    bearing_deg: null,
  }))
}

/** Which local wall an opening at floor coordinate `c` lies in, and its offset from that wall's `a` end. */
function openingPlacement(o: FixedOpening, c: number, r: RectM): { edge: Edge; offset: number } {
  if (o.orientation === 'h') {
    return near(c, r.y) ? { edge: 's', offset: o.start - r.x } : { edge: 'n', offset: r.x + r.w - o.end }
  }
  return near(c, r.x) ? { edge: 'w', offset: r.y + r.d - o.end } : { edge: 'e', offset: o.start - r.y }
}

export interface Obstacle extends RectM {
  kind: 'fixture' | 'door_clearance'
  label: string
}

/** Canonical scene for the current partitions. Callers must have validated the geometry. */
export function buildFloor(rooms: RoomEdit[], transforms: RoomTransform[]): Floor {
  const rects = floorRects(rooms, transforms)
  const sceneRooms: Room[] = rooms.map((room) => {
    const r = rects.get(room.id) as RectM
    const walls = localWalls(room.id, r.w, r.d, r)
    const openings: Opening[] = []
    for (const o of OPENINGS) {
      if (!o.rooms.includes(room.id)) continue
      const c = openingWallCoordinate(o, rects)
      if (c === null) continue
      const { edge, offset } = openingPlacement(o, c, r)
      const other = o.rooms.find((id) => id !== room.id) ?? null
      openings.push({
        id: o.id,
        kind: o.kind,
        wall_id: `${room.id}-wall-${edge}`,
        offset_m: round3(offset),
        width_m: round3(o.end - o.start),
        height_m: o.height_m,
        sill_m: o.sill_m,
        swing: o.kind !== 'door' ? 'none' : o.swingInto === room.id ? 'in_left' : 'out_left',
        leads_to_room_id: o.kind === 'window' ? null : other,
        is_egress: o.is_egress,
        provenance: 'demo',
      })
    }
    const objects: SceneObject[] = FIXTURES.filter((f) => f.roomId === room.id).map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      variant_id: null,
      pose: { x: round3(f.cx - r.x), y: round3(f.cy - r.y), z: 0, rot: f.rot },
      footprint: { w: f.w, d: f.d, h: f.h },
      materials: f.materials,
      colors: [{ hex: f.hex, coverage_pct: 100 }],
      anchored: true,
      is_fixed: true,
      provenance: 'demo',
    }))
    return {
      id: room.id,
      label: room.label,
      type: room.type,
      polygon: room.polygon,
      ceiling_height_m: CEILING_HEIGHT_M,
      ceiling_type: 'flat',
      area_m2: round3(r.w * r.d),
      walls,
      openings,
      features: [],
      objects,
    }
  })
  return { id: 'floor-1', level: 0, height_m: CEILING_HEIGHT_M, rooms: sceneRooms, stairs: [] }
}

/**
 * Room-local keep-out rectangles for placement: fixed fixtures plus door
 * clearances (a full swing square where a door opens into the room, a strip
 * where it opens away, and an approach zone on both sides of a doorway).
 */
export function roomObstacles(room: Room): Obstacle[] {
  const { w, d } = polygonSize(room.polygon)
  const out: Obstacle[] = room.objects
    .filter((o) => o.is_fixed)
    .map((o) => {
      const ext = planExtents(o.footprint.w, o.footprint.d, o.pose.rot)
      return { kind: 'fixture' as const, label: o.label, x: o.pose.x - ext.w / 2, y: o.pose.y - ext.d / 2, w: ext.w, d: ext.d }
    })
  for (const opening of room.openings) {
    if (opening.kind === 'window') continue
    const depth = opening.kind === 'doorway' ? 0.6 : opening.swing.startsWith('in') ? opening.width_m : 0.3
    const edge = opening.wall_id.slice(-1) as Edge
    const len = opening.width_m
    const o = opening.offset_m
    const label = `${opening.kind === 'doorway' ? 'Doorway' : 'Door'} clearance`
    if (edge === 's') out.push({ kind: 'door_clearance', label, x: o, y: 0, w: len, d: depth })
    if (edge === 'n') out.push({ kind: 'door_clearance', label, x: w - o - len, y: d - depth, w: len, d: depth })
    if (edge === 'e') out.push({ kind: 'door_clearance', label, x: w - depth, y: o, w: depth, d: len })
    if (edge === 'w') out.push({ kind: 'door_clearance', label, x: 0, y: d - o - len, w: depth, d: len })
  }
  return out
}

export const ROOM_TYPES_IN_DEMO: RoomType[] = ['living_room', 'kitchen', 'bedroom_primary', 'bathroom_full']
