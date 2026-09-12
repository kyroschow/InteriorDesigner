/**
 * API scene (meters, room-local, Y up) → the SVG renderer's plan space
 * (inches, floor space, Y down), per "Data and coordinate contract" in
 * docs/design/interior-workspace-draft.md:
 *
 *   xIn = xM / 0.0254,  yIn = (floorDepthM - yM) / 0.0254
 *
 * Room-local points are moved into floor space first. Rotations are 90°
 * multiples, so a canonical front (+Y at rot 0) maps to the plan's top edge.
 * Unit preference only changes labels, never this geometry.
 */
import type { Door, FloorPlan, PlanBox, RoomSpec, RoomType as PlanRoomType } from './floorplan'
import type { Floor, PlacedObject, Point, RoomTransform, RoomType, WallSide } from '@/types/interior'

const IN_PER_M = 1 / 0.0254

/**
 * A floor plus where each room sits on it. Layouts carry only the scene, so
 * callers pair a layout's scene with the project's transforms (the demo shell's
 * walls are fixed, so rooms never move).
 */
export interface Scene {
  floor: Floor
  roomTransforms: RoomTransform[]
}

export const PLAN_ROOM_TYPE: Record<RoomType, PlanRoomType> = {
  living_room: 'living',
  kitchen: 'kitchen',
  bedroom: 'bedroom',
  bathroom: 'bathroom',
}

export function polygonSizeM(polygon: Point[]): { w: number; d: number } {
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...ys) - Math.min(...ys) }
}

/** "SLATTUM — Upholstered bed frame, Vissle dark gray, Queen" → "SLATTUM". */
export const shortName = (name: string) => name.split(' — ')[0]

const originOf = (scene: Scene, roomId: string) => scene.roomTransforms.find((t) => t.roomId === roomId)?.origin ?? { x: 0, y: 0 }

/** Floor-space meters (Y up) → plan inches (Y down). */
export function toPlan(xM: number, yM: number, depthM: number): { x: number; y: number } {
  return { x: xM * IN_PER_M, y: (depthM - yM) * IN_PER_M }
}

/** A floor-space rectangle (min corner + size, meters) → plan rect (top-left + size, inches). */
export function floorRectToPlan(xM: number, yM: number, wM: number, dM: number, depthM: number) {
  const topLeft = toPlan(xM, yM + dM, depthM)
  return { x: topLeft.x, y: topLeft.y, w: wM * IN_PER_M, h: dM * IN_PER_M }
}

const FRONT: Record<number, PlanBox['front']> = { 0: 'top', 90: 'right', 180: 'bottom', 270: 'left' }

function objectBox(obj: PlacedObject, origin: Point, depthM: number, showLabel: boolean): PlanBox {
  const ext = obj.pose.rot % 180 === 0 ? { w: obj.footprint.w, d: obj.footprint.d } : { w: obj.footprint.d, d: obj.footprint.w }
  const rect = floorRectToPlan(origin.x + obj.pose.x - ext.w / 2, origin.y + obj.pose.y - ext.d / 2, ext.w, ext.d, depthM)
  return { id: obj.id, label: shortName(obj.name), ...rect, front: FRONT[obj.pose.rot] ?? 'top', fixed: false, showLabel }
}

export function sceneToPlan(scene: Scene, name: string): FloorPlan {
  const depth = scene.floor.depth_m
  const rooms: RoomSpec[] = []
  const doors = new Map<string, Door>()

  for (const room of scene.floor.rooms) {
    const o = originOf(scene, room.id)
    const { w, d } = polygonSizeM(room.polygon)
    rooms.push({ id: room.id, name: room.label, type: PLAN_ROOM_TYPE[room.type], footprint: floorRectToPlan(o.x, o.y, w, d, depth) })

    for (const opening of room.openings) {
      if (doors.has(opening.id)) continue
      const side = opening.wall_id.replace('wall-', '') as WallSide
      // offset_m is the along-wall coordinate of the opening's lower end.
      const lo = opening.offset_m
      const hi = opening.offset_m + opening.width_m
      const [a, b] =
        side === 'bottom'
          ? [{ x: lo, y: 0 }, { x: hi, y: 0 }]
          : side === 'top'
            ? [{ x: lo, y: d }, { x: hi, y: d }]
            : side === 'left'
              ? [{ x: 0, y: lo }, { x: 0, y: hi }]
              : [{ x: w, y: lo }, { x: w, y: hi }]
      const pa = toPlan(o.x + a.x, o.y + a.y, depth)
      const pb = toPlan(o.x + b.x, o.y + b.y, depth)
      const horizontal = side === 'bottom' || side === 'top'
      doors.set(opening.id, {
        x: horizontal ? Math.min(pa.x, pb.x) : pa.x,
        y: horizontal ? pa.y : Math.min(pa.y, pb.y),
        length: horizontal ? Math.abs(pb.x - pa.x) : Math.abs(pb.y - pa.y),
        orientation: horizontal ? 'h' : 'v',
        kind: opening.kind,
      })
    }
  }
  return { id: 'scene', name, rooms, doors: [...doors.values()] }
}

/** Placed furniture per room, labelled once per distinct product. */
export function sceneFurniture(scene: Scene): Record<string, PlanBox[]> {
  const depth = scene.floor.depth_m
  const out: Record<string, PlanBox[]> = {}
  for (const room of scene.floor.rooms) {
    const seen = new Set<string>()
    out[room.id] = room.objects.map((obj) => {
      const first = !seen.has(obj.itemId)
      seen.add(obj.itemId)
      return objectBox(obj, originOf(scene, room.id), depth, first)
    })
  }
  return out
}
