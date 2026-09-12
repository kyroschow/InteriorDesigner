import type { CatalogItem } from '../catalog/load.ts'
import type { Dimensions, Pose, Room, Rotation, WallSide } from '../domain/types.ts'
import { ROTATIONS } from '../domain/types.ts'
import { type Side, frontVector, rightVector, rotationFacing, sideVector } from '../geometry/rect.ts'
import { wallSpans } from '../rules/engine.ts'

/**
 * Relational placement anchors proposed by the AI. They are resolved into exact
 * poses here, deterministically, so the model never has to do trigonometry.
 *
 * - wall:   back against `wallId`, facing into the room. `alongM` is the item's
 *           lower edge along the wall: x for bottom/top walls, y for left/right.
 * - beside: same rotation as the reference item, back edges aligned, on its
 *           left/right (as seen facing the same way as the reference).
 * - facing: on `side` of the reference item, turned to face it; `distanceM` is
 *           the gap between the two (negative tucks a chair under a table);
 *           `shiftM` slides it sideways along that edge.
 * - free:   explicit center `x`,`y` (room-local meters) and `rot`.
 */
export interface Anchor {
  type: 'wall' | 'beside' | 'facing' | 'free'
  wallId?: string | null
  alongM?: number | null
  gapM?: number | null
  refInstanceId?: string | null
  side?: Side | null
  distanceM?: number | null
  shiftM?: number | null
  x?: number | null
  y?: number | null
  rot?: number | null
}

export interface ProposedPlacement {
  instanceId: string
  roomId: string
  itemId: string
  anchor: Anchor
}

export interface ResolvedPlacement {
  instanceId: string
  roomId: string
  item: CatalogItem
  pose: Pose
  footprint: Dimensions
}

const round3 = (v: number) => Math.round(v * 1000) / 1000

const WALL_ROTATION: Record<WallSide, Rotation> = { bottom: 0, left: 90, top: 180, right: 270 }

function roomSize(room: Room): { w: number; d: number } {
  return { w: Math.max(...room.polygon.map((p) => p.x)), d: Math.max(...room.polygon.map((p) => p.y)) }
}

/** Without alongM, center the item in the widest free span of the wall that fits it. */
function defaultAlong(room: Room, wallId: string, width: number): number {
  const wall = wallSpans(room).find((s) => s.wallId === wallId)!
  const fits = wall.freeSpansM.filter(([a, b]) => b - a >= width).sort((x, y) => y[1] - y[0] - (x[1] - x[0]))
  const [a, b] = fits[0] ?? [0, wall.lengthM]
  return a + (b - a - width) / 2
}

function resolveOne(
  p: ProposedPlacement,
  room: Room,
  item: CatalogItem,
  resolved: Map<string, ResolvedPlacement>,
): Pose | string {
  const a = p.anchor
  const { w, d } = item.footprint
  const gap = a.gapM ?? 0

  switch (a.type) {
    case 'wall': {
      const wall = room.walls.find((wl) => wl.id === a.wallId)
      if (!wall) return `unknown wallId ${a.wallId} in ${room.id} (use one of ${room.walls.map((wl) => wl.id).join(', ')})`
      const size = roomSize(room)
      const along = (a.alongM ?? defaultAlong(room, wall.id, w)) + w / 2
      const rot = WALL_ROTATION[wall.side]
      switch (wall.side) {
        case 'bottom':
          return { x: along, y: gap + d / 2, z: 0, rot }
        case 'top':
          return { x: along, y: size.d - gap - d / 2, z: 0, rot }
        case 'left':
          return { x: gap + d / 2, y: along, z: 0, rot }
        case 'right':
          return { x: size.w - gap - d / 2, y: along, z: 0, rot }
      }
      break
    }
    case 'beside': {
      const ref = a.refInstanceId ? resolved.get(a.refInstanceId) : undefined
      if (!ref) return 'unresolved'
      if (a.side !== 'left' && a.side !== 'right') return 'beside anchor needs side "left" or "right"'
      const f = frontVector(ref.pose.rot)
      const r = rightVector(ref.pose.rot)
      const s = a.side === 'right' ? 1 : -1
      const lateral = ref.footprint.w / 2 + gap + w / 2
      const forward = (d - ref.footprint.d) / 2
      return {
        x: ref.pose.x + f.x * forward + s * r.x * lateral,
        y: ref.pose.y + f.y * forward + s * r.y * lateral,
        z: 0,
        rot: ref.pose.rot,
      }
    }
    case 'facing': {
      const ref = a.refInstanceId ? resolved.get(a.refInstanceId) : undefined
      if (!ref) return 'unresolved'
      if (!a.side) return 'facing anchor needs side (front, back, left or right of the reference)'
      const dir = sideVector(ref.pose.rot, a.side)
      const refExtent = a.side === 'front' || a.side === 'back' ? ref.footprint.d : ref.footprint.w
      const dist = refExtent / 2 + (a.distanceM ?? 0) + d / 2
      const lat = { x: dir.y, y: -dir.x }
      const shift = a.shiftM ?? 0
      return {
        x: ref.pose.x + dir.x * dist + lat.x * shift,
        y: ref.pose.y + dir.y * dist + lat.y * shift,
        z: 0,
        rot: rotationFacing({ x: -dir.x, y: -dir.y }),
      }
    }
    case 'free': {
      if (a.x == null || a.y == null) return 'free anchor needs x and y'
      const rot = a.rot ?? 0
      if (!ROTATIONS.includes(rot as Rotation)) return 'rot must be 0, 90, 180 or 270'
      return { x: a.x, y: a.y, z: 0, rot: rot as Rotation }
    }
  }
  return `unknown anchor type ${String(a.type)}`
}

/** Resolve anchors in dependency order. Errors are phrased for the AI to act on. */
export function expandPlacements(
  proposals: ProposedPlacement[],
  rooms: Map<string, Room>,
  items: Map<string, CatalogItem>,
): { placements: ResolvedPlacement[]; errors: string[] } {
  const resolved = new Map<string, ResolvedPlacement>()
  const errors: string[] = []
  const failed = new Set<string>()
  const fail = (instanceId: string, message: string) => {
    errors.push(`${instanceId}: ${message}`)
    failed.add(instanceId)
  }
  let pending = [...proposals]

  while (pending.length > 0) {
    const next: ProposedPlacement[] = []
    for (const p of pending) {
      const room = rooms.get(p.roomId)
      const item = items.get(p.itemId)
      if (!room || !item) continue // reported by argument validation
      const refId = p.anchor.refInstanceId
      const usesRef = p.anchor.type === 'beside' || p.anchor.type === 'facing'
      if (usesRef && !refId) {
        fail(p.instanceId, `${p.anchor.type} anchor needs refInstanceId`)
        continue
      }
      if (usesRef && refId && !proposals.some((q) => q.instanceId === refId)) {
        fail(p.instanceId, `refInstanceId ${refId} is not in this layout`)
        continue
      }
      if (usesRef && refId && failed.has(refId)) {
        fail(p.instanceId, `placed relative to ${refId}, which has its own error; fix that first`)
        continue
      }
      const ref = usesRef && refId ? proposals.find((q) => q.instanceId === refId) : undefined
      if (ref && ref.roomId !== p.roomId) {
        fail(p.instanceId, `reference ${ref.instanceId} is in a different room`)
        continue
      }
      const pose = resolveOne(p, room, item, resolved)
      if (pose === 'unresolved') {
        next.push(p)
        continue
      }
      if (typeof pose === 'string') {
        fail(p.instanceId, pose)
        continue
      }
      resolved.set(p.instanceId, {
        instanceId: p.instanceId,
        roomId: p.roomId,
        item,
        pose: { x: round3(pose.x), y: round3(pose.y), z: 0, rot: pose.rot },
        footprint: item.footprint,
      })
    }
    if (next.length === pending.length) {
      for (const p of next) errors.push(`${p.instanceId}: reference chain through ${p.anchor.refInstanceId} could not be resolved (cycle or invalid reference)`)
      break
    }
    pending = next
  }
  return { placements: [...resolved.values()], errors }
}
