import type { TypeSpec } from '../catalog/load.ts'
import type { Dimensions, ObjectType, Opening, Pose, Room, WallSide } from '../domain/types.ts'
import {
  type Rect,
  area,
  backGapToWall,
  contains,
  fmt,
  fmtRect,
  height,
  intersection,
  mm,
  poseRect,
  sideVector,
  sideZone,
  subtractIntervals,
  wallAxis,
  wallStrip,
  width,
} from '../geometry/rect.ts'
import { type Obstacle, analyzeWalkway } from './raster.ts'

export interface RuleParams {
  walkwayWidthM: number
  doorClearDepthM: number
  wallGapMaxM: number
  windowZoneDepthM: number
  chairTuckMaxM: number
  gridM: number
}

export const DEFAULT_PARAMS: RuleParams = {
  walkwayWidthM: 0.9,
  doorClearDepthM: 0.9,
  wallGapMaxM: 0.05,
  windowZoneDepthM: 0.15,
  chairTuckMaxM: 0.3,
  gridM: 0.05,
}

export const SAFETY_RULES = [
  { id: 'SAFE-CONTAIN', title: 'Inside the room', description: 'Every item footprint lies fully inside its room.', params: {} },
  {
    id: 'SAFE-OVERLAP',
    title: 'No overlapping items',
    description: 'Item footprints do not overlap (touching is fine). A dining chair may tuck under a dining table.',
    params: { chairTuckMaxM: DEFAULT_PARAMS.chairTuckMaxM },
  },
  {
    id: 'SAFE-DOOR-SWING',
    title: 'Door swings clear',
    description: 'Nothing is placed where a door leaf swings into the room.',
    params: {},
  },
  {
    id: 'SAFE-DOOR-APPROACH',
    title: 'Door approaches clear',
    description: 'A zone the width of each door or doorway, and this deep, stays clear on the room side.',
    params: { doorClearDepthM: DEFAULT_PARAMS.doorClearDepthM },
  },
  {
    id: 'SAFE-PATHWAY',
    title: 'Walkways between doors',
    description: 'Every door in a room is connected to the others by a continuous walkway at least this wide.',
    params: { walkwayWidthM: DEFAULT_PARAMS.walkwayWidthM },
  },
  {
    id: 'SAFE-ACCESS',
    title: 'Usable access space',
    description:
      'Each item keeps its use-side clearance (bed side, dresser front, toilet front, counter front, ...) inside the room, free of other items and reachable by the walkway.',
    params: {},
  },
  {
    id: 'SAFE-WALL',
    title: 'Wall-standing items against a wall',
    description: 'Beds, dressers, TV stands, counters, sinks, toilets and showers stand with their back against a wall, not across a door opening.',
    params: { wallGapMaxM: DEFAULT_PARAMS.wallGapMaxM },
  },
  {
    id: 'SAFE-WINDOW',
    title: 'Windows not blocked',
    description: 'Items taller than a window sill are not placed directly in front of that window.',
    params: { windowZoneDepthM: DEFAULT_PARAMS.windowZoneDepthM },
  },
  { id: 'SAFE-ELIGIBLE', title: 'Right room', description: 'Each item type is allowed in its room type and assigned room.', params: {} },
  { id: 'SAFE-QUANTITY', title: 'Exact quantities', description: 'Every requested instance is placed exactly once and nothing extra is added.', params: {} },
  { id: 'SAFE-BUDGET', title: 'Within budget', description: 'Total price of priced items is within the budget, when one is set.', params: {} },
] as const

export type RuleId = (typeof SAFETY_RULES)[number]['id']

export interface EngineItem {
  instanceId: string
  roomId: string
  type: ObjectType
  itemId: string
  name: string
  pose: Pose
  footprint: Dimensions
  priceMinor: number | null
}

export interface ExpectedInstance {
  instanceId: string
  objectType: ObjectType
  allowedRoomIds: string[]
}

export interface Violation {
  ruleId: RuleId
  roomId: string | null
  itemIds: string[]
  message: string
  hint: string
}

export interface RoomMetrics {
  roomId: string
  walkableAreaPct: number
  minPathWidthM: number | null
  doorsConnected: boolean
}

export interface EngineReport {
  pass: boolean
  violations: Violation[]
  metrics: RoomMetrics[]
  score: number
  totalPriceMinor: number
  unpricedItemIds: string[]
}

export interface EvaluateInput {
  rooms: Room[]
  items: EngineItem[]
  types: Record<ObjectType, TypeSpec>
  expected?: ExpectedInstance[]
  budgetMinor?: number | null
  /** Rooms to evaluate; defaults to every room. */
  roomIds?: string[]
  params?: Partial<RuleParams>
}

interface DoorZone {
  opening: Opening
  side: WallSide
  span: [number, number]
  clear: Rect
  swing: Rect | null
}

export interface RoomGeometry {
  W: number
  D: number
  roomRect: Rect
  doors: DoorZone[]
  windows: { opening: Opening; side: WallSide; span: [number, number] }[]
}

const sideOf = (wallId: string) => wallId.replace('wall-', '') as WallSide

export function roomGeometry(room: Room, params: RuleParams = DEFAULT_PARAMS): RoomGeometry {
  const W = mm(Math.max(...room.polygon.map((p) => p.x)))
  const D = mm(Math.max(...room.polygon.map((p) => p.y)))
  const doors: DoorZone[] = []
  const windows: RoomGeometry['windows'] = []
  for (const o of room.openings) {
    const side = sideOf(o.wall_id)
    const span: [number, number] = [mm(o.offset_m), mm(o.offset_m + o.width_m)]
    if (o.kind === 'window') {
      windows.push({ opening: o, side, span })
      continue
    }
    const swingDepth = o.swing === 'into_room' ? mm(o.width_m) : 0
    const depth = Math.max(mm(params.doorClearDepthM), swingDepth)
    doors.push({
      opening: o,
      side,
      span,
      clear: wallStrip(side, span[0], span[1], depth, W, D),
      swing: swingDepth > 0 ? wallStrip(side, span[0], span[1], swingDepth, W, D) : null,
    })
  }
  return { W, D, roomRect: { x0: 0, y0: 0, x1: W, y1: D }, doors, windows }
}

export interface WallSpans {
  wallId: string
  lengthM: number
  exterior: boolean
  /** Along-wall intervals (m) where furniture up to 0.6 m deep avoids doors and their clear zones. */
  freeSpansM: [number, number][]
  windows: { id: string; fromM: number; toM: number; sillM: number }[]
  doors: { id: string; fromM: number; toM: number }[]
}

export function wallSpans(room: Room, params: RuleParams = DEFAULT_PARAMS): WallSpans[] {
  const g = roomGeometry(room, params)
  return room.walls.map((wall) => {
    const side = wall.side
    const length = side === 'bottom' || side === 'top' ? g.W : g.D
    const axis = wallAxis(side)
    const strip = wallStrip(side, 0, length, 600, g.W, g.D)
    const cuts: [number, number][] = []
    for (const door of g.doors) {
      const hit = intersection(strip, door.clear)
      if (hit) cuts.push(axis === 'x' ? [hit.x0, hit.x1] : [hit.y0, hit.y1])
    }
    const free = subtractIntervals(0, length, cuts).filter(([a, b]) => b - a >= 300)
    return {
      wallId: wall.id,
      lengthM: length / 1000,
      exterior: wall.is_exterior,
      freeSpansM: free.map(([a, b]) => [a / 1000, b / 1000] as [number, number]),
      windows: g.windows
        .filter((w) => w.side === side)
        .map((w) => ({ id: w.opening.id, fromM: w.span[0] / 1000, toM: w.span[1] / 1000, sillM: w.opening.sill_m })),
      doors: g.doors
        .filter((d) => d.side === side)
        .map((d) => ({ id: d.opening.id, fromM: d.span[0] / 1000, toM: d.span[1] / 1000 })),
    }
  })
}

const spansText = (spans: [number, number][]) =>
  spans.length ? spans.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}`).join(', ') : 'none'

export function evaluate(input: EvaluateInput): EngineReport {
  const params = { ...DEFAULT_PARAMS, ...input.params }
  const walkway = mm(params.walkwayWidthM)
  const violations: Violation[] = []
  const metrics: RoomMetrics[] = []
  const add = (v: Violation) => violations.push(v)

  // Instance coverage, eligibility and budget are global.
  if (input.expected) {
    const expectedById = new Map(input.expected.map((e) => [e.instanceId, e]))
    for (const e of input.expected) {
      const n = input.items.filter((it) => it.instanceId === e.instanceId).length
      if (n === 0) {
        add({ ruleId: 'SAFE-QUANTITY', roomId: null, itemIds: [e.instanceId], message: `${e.instanceId} (${e.objectType}) is not placed.`, hint: `Add a placement for ${e.instanceId} in one of: ${e.allowedRoomIds.join(', ')}.` })
      } else if (n > 1) {
        add({ ruleId: 'SAFE-QUANTITY', roomId: null, itemIds: [e.instanceId], message: `${e.instanceId} is placed ${n} times.`, hint: 'Place each instance exactly once.' })
      }
    }
    for (const it of input.items) {
      const e = expectedById.get(it.instanceId)
      if (!e) {
        add({ ruleId: 'SAFE-QUANTITY', roomId: it.roomId, itemIds: [it.instanceId], message: `${it.instanceId} was not requested.`, hint: 'Remove it; only place the requested instances.' })
      } else if (e.objectType !== it.type || !e.allowedRoomIds.includes(it.roomId)) {
        add({ ruleId: 'SAFE-ELIGIBLE', roomId: it.roomId, itemIds: [it.instanceId], message: `${it.instanceId} cannot go in ${it.roomId}.`, hint: `Allowed rooms: ${e.allowedRoomIds.join(', ')}.` })
      }
    }
  }
  const totalPriceMinor = input.items.reduce((sum, it) => sum + (it.priceMinor ?? 0), 0)
  const unpricedItemIds = input.items.filter((it) => it.priceMinor == null).map((it) => it.instanceId)
  if (input.budgetMinor != null && totalPriceMinor > input.budgetMinor) {
    add({
      ruleId: 'SAFE-BUDGET',
      roomId: null,
      itemIds: input.items.filter((it) => it.priceMinor != null).map((it) => it.instanceId),
      message: `Total $${(totalPriceMinor / 100).toFixed(2)} exceeds the budget of $${(input.budgetMinor / 100).toFixed(2)}.`,
      hint: `Choose cheaper candidate items to save at least $${((totalPriceMinor - input.budgetMinor) / 100).toFixed(2)}.`,
    })
  }

  const roomIds = input.roomIds ?? input.rooms.map((r) => r.id)
  for (const room of input.rooms.filter((r) => roomIds.includes(r.id))) {
    const g = roomGeometry(room, params)
    const spans = wallSpans(room, params)
    const items = input.items.filter((it) => it.roomId === room.id).map((it) => ({ ...it, rect: poseRect(it.pose, it.footprint) }))

    for (const it of items) {
      const spec = input.types[it.type]
      if (!spec.roomTypes.includes(room.type)) {
        add({ ruleId: 'SAFE-ELIGIBLE', roomId: room.id, itemIds: [it.instanceId], message: `A ${it.type} is not allowed in a ${room.type}.`, hint: `Allowed room types: ${spec.roomTypes.join(', ')}.` })
      }

      if (!contains(g.roomRect, it.rect)) {
        const moves = [
          it.rect.x0 < 0 && `right by ≥ ${fmt(-it.rect.x0)} m`,
          it.rect.x1 > g.W && `left by ≥ ${fmt(it.rect.x1 - g.W)} m`,
          it.rect.y0 < 0 && `up (+y) by ≥ ${fmt(-it.rect.y0)} m`,
          it.rect.y1 > g.D && `down (-y) by ≥ ${fmt(it.rect.y1 - g.D)} m`,
        ].filter(Boolean)
        add({
          ruleId: 'SAFE-CONTAIN',
          roomId: room.id,
          itemIds: [it.instanceId],
          message: `${it.instanceId} (${fmtRect(it.rect)}) extends outside the ${fmt(g.W)} x ${fmt(g.D)} m room.`,
          hint: `Move it ${moves.join(' and ')}.`,
        })
      }

      for (const door of g.doors) {
        const inSwing = door.swing ? intersection(it.rect, door.swing) : null
        const inClear = intersection(it.rect, door.clear)
        if (!inSwing && !inClear) continue
        const wall = spans.find((s) => s.wallId === `wall-${door.side}`)
        add({
          ruleId: inSwing ? 'SAFE-DOOR-SWING' : 'SAFE-DOOR-APPROACH',
          roomId: room.id,
          itemIds: [it.instanceId],
          message: inSwing
            ? `${it.instanceId} is inside the swing of ${door.opening.id}.`
            : `${it.instanceId} blocks the approach to ${door.opening.id}.`,
          hint: `Keep ${fmtRect(door.clear)} clear.${wall ? ` Free spans on ${wall.wallId}: ${spansText(wall.freeSpansM)}.` : ''}`,
        })
      }

      if (spec.wallRule === 'back_to_wall') {
        const { side, gap } = backGapToWall(it.rect, it.pose.rot, g.W, g.D)
        const wall = spans.find((s) => s.wallId === `wall-${side}`)!
        if (gap > mm(params.wallGapMaxM) || gap < 0) {
          add({
            ruleId: 'SAFE-WALL',
            roomId: room.id,
            itemIds: [it.instanceId],
            message: `${it.instanceId} must stand with its back against a wall; it is ${fmt(Math.abs(gap))} m from wall-${side}.`,
            hint: `Use a "wall" anchor (gapM 0). Free spans on walls: ${spans.map((s) => `${s.wallId} ${spansText(s.freeSpansM)}`).join('; ')}.`,
          })
        } else {
          const axis = wallAxis(side)
          const along: [number, number] = axis === 'x' ? [it.rect.x0, it.rect.x1] : [it.rect.y0, it.rect.y1]
          for (const door of g.doors.filter((d) => d.side === side)) {
            if (along[0] < door.span[1] && along[1] > door.span[0]) {
              add({
                ruleId: 'SAFE-WALL',
                roomId: room.id,
                itemIds: [it.instanceId],
                message: `${it.instanceId} stands across the opening of ${door.opening.id} on wall-${side}.`,
                hint: `Free spans on wall-${side}: ${spansText(wall.freeSpansM)}.`,
              })
            }
          }
        }
      }

      const itemHeight = mm(it.footprint.h)
      for (const win of g.windows) {
        if (itemHeight <= mm(win.opening.sill_m)) continue
        const zone = wallStrip(win.side, win.span[0], win.span[1], mm(params.windowZoneDepthM), g.W, g.D)
        if (intersection(it.rect, zone)) {
          add({
            ruleId: 'SAFE-WINDOW',
            roomId: room.id,
            itemIds: [it.instanceId],
            message: `${it.instanceId} (${it.footprint.h.toFixed(2)} m tall) blocks ${win.opening.id} (sill ${win.opening.sill_m.toFixed(2)} m) on wall-${win.side}.`,
            hint: `Avoid wall-${win.side} between ${fmt(win.span[0])} and ${fmt(win.span[1])} for this item, or pick a lower item.`,
          })
        }
      }
    }

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]
        const hit = intersection(a.rect, b.rect)
        if (!hit) continue
        const types = new Set([a.type, b.type])
        const tuck = types.has('dining_chair') && types.has('dining_table') && Math.min(width(hit), height(hit)) <= mm(params.chairTuckMaxM)
        if (tuck) continue
        add({
          ruleId: 'SAFE-OVERLAP',
          roomId: room.id,
          itemIds: [a.instanceId, b.instanceId],
          message: `${a.instanceId} and ${b.instanceId} overlap by ${fmt(width(hit))} m (x) x ${fmt(height(hit))} m (y).`,
          hint: `Move one of them ≥ ${fmt(width(hit))} m along x or ≥ ${fmt(height(hit))} m along y, or use another wall span.`,
        })
      }
    }

    // Walkway analysis: walls (minus door openings) and every item are obstacles.
    const obstacles: Obstacle[] = items.map((it) => ({ rect: it.rect, label: it.instanceId }))
    for (const wall of room.walls) {
      const side = wall.side
      const length = side === 'bottom' || side === 'top' ? g.W : g.D
      const gaps = g.doors.filter((d) => d.side === side).map((d) => d.span)
      for (const [a, b] of subtractIntervals(0, length, gaps)) {
        obstacles.push({ rect: wallStrip(side, a, b, 0, g.W, g.D), label: wall.id })
      }
    }
    const grid = mm(params.gridM)
    const walk = analyzeWalkway(
      g.W,
      g.D,
      obstacles,
      g.doors.map((d) => ({ id: d.opening.id, seed: wallStrip(d.side, d.span[0], d.span[1], 2 * grid, g.W, g.D) })),
      walkway,
      grid,
    )

    const pathWidths: number[] = []
    let doorsConnected = true
    for (const door of g.doors.slice(1)) {
      const reach = walk.doorReach.get(door.opening.id)!
      pathWidths.push(reach.widthMm)
      if (reach.widthMm < walkway - 1) {
        doorsConnected = false
        const at = reach.narrowPoint
        add({
          ruleId: 'SAFE-PATHWAY',
          roomId: room.id,
          itemIds: at && !at.nextTo.startsWith('wall-') ? [at.nextTo] : [],
          message: `The walkway from ${walk.primaryDoorId} to ${door.opening.id} narrows to ${fmt(reach.widthMm)} m${at ? ` at (${fmt(at.x)}, ${fmt(at.y)}) next to ${at.nextTo}` : ''}.`,
          hint: `Keep at least ${fmt(walkway)} m clear along a path between the doors${at && !at.nextTo.startsWith('wall-') ? `; move ${at.nextTo} away from that point` : ''}.`,
        })
      }
    }

    for (const it of items) {
      for (const access of input.types[it.type].access) {
        const depth = mm(access.depthM)
        const results = access.sides.map((side) => {
          let zone = sideZone(it.rect, it.pose.rot, side, depth)
          if (access.insetBackM && (side === 'left' || side === 'right')) {
            const back = sideVector(it.pose.rot, 'back')
            const inset = mm(access.insetBackM)
            if (back.y < 0) zone = { ...zone, y0: Math.max(zone.y0, it.rect.y0 + inset) }
            if (back.y > 0) zone = { ...zone, y1: Math.min(zone.y1, it.rect.y1 - inset) }
            if (back.x < 0) zone = { ...zone, x0: Math.max(zone.x0, it.rect.x0 + inset) }
            if (back.x > 0) zone = { ...zone, x1: Math.min(zone.x1, it.rect.x1 - inset) }
          }
          if (area(zone) <= 0) return { side, zone, problem: null as string | null }
          if (!contains(g.roomRect, zone)) return { side, zone, problem: 'runs into a wall' }
          const blockers = items.filter((o) => o.instanceId !== it.instanceId && intersection(o.rect, zone))
          if (blockers.length) return { side, zone, problem: `is blocked by ${blockers.map((b) => b.instanceId).join(', ')}` }
          if (g.doors.length > 0) {
            const reach = walk.reachZone(zone)
            pathWidths.push(reach.widthMm)
            if (reach.widthMm < walkway - 1) return { side, zone, problem: `cannot be reached by a ${fmt(walkway)} m walkway` }
          }
          return { side, zone, problem: null }
        })
        const failing = results.filter((r) => r.problem)
        const ok = access.rule === 'any' ? failing.length < results.length : failing.length === 0
        if (ok) continue
        add({
          ruleId: 'SAFE-ACCESS',
          roomId: room.id,
          itemIds: [it.instanceId],
          message: `${it.instanceId} needs ${access.depthM.toFixed(2)} m clear on its ${access.sides.join(access.rule === 'any' ? ' or ' : ' and ')} side: ${failing.map((r) => `${r.side} ${r.problem}`).join('; ')}.`,
          hint: `Leave ${failing.map((r) => `${fmtRect(r.zone)} (${r.side})`).join(access.rule === 'any' ? ' or ' : ' and ')} free and connected to the walkway.`,
        })
      }
    }

    metrics.push({
      roomId: room.id,
      walkableAreaPct: walk.walkableAreaPct,
      minPathWidthM: pathWidths.length ? Math.min(...pathWidths) / 1000 : null,
      doorsConnected,
    })
  }

  const roomScores = metrics.map((mt) => 0.7 * (mt.walkableAreaPct / 100) + 0.3 * Math.min(1, (mt.minPathWidthM ?? params.walkwayWidthM) / 1.5))
  const score = roomScores.length ? Math.round((100 * roomScores.reduce((a, b) => a + b, 0)) / roomScores.length) : 0

  return { pass: violations.length === 0, violations, metrics, score, totalPriceMinor, unpricedItemIds }
}
