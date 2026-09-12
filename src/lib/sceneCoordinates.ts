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
import type { Floor, Point, RoomTransform, RoomType, SceneObject } from '@/types/interior'

const IN_PER_M = 1 / 0.0254
const EDGE_TOLERANCE_IN = 0.5

export interface Scene {
  floor: Floor
  roomTransforms: RoomTransform[]
  footprintM: { w: number; d: number }
}

export const PLAN_ROOM_TYPE: Record<RoomType, PlanRoomType> = {
  living_room: 'living',
  kitchen: 'kitchen',
  bedroom_primary: 'bedroom',
  bathroom_full: 'bathroom',
}

export function polygonSizeM(polygon: Point[]): { w: number; d: number } {
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...ys) - Math.min(...ys) }
}

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

function objectBox(obj: SceneObject, origin: Point, depthM: number, showLabel: boolean): PlanBox {
  const rot = ((obj.pose.rot % 360) + 360) % 360
  const ext = rot % 180 === 0 ? { w: obj.footprint.w, d: obj.footprint.d } : { w: obj.footprint.d, d: obj.footprint.w }
  const rect = floorRectToPlan(origin.x + obj.pose.x - ext.w / 2, origin.y + obj.pose.y - ext.d / 2, ext.w, ext.d, depthM)
  return { id: obj.id, label: obj.label, ...rect, front: FRONT[rot] ?? 'top', fixed: obj.is_fixed, showLabel }
}

export function sceneToPlan(scene: Scene, name: string): FloorPlan {
  const depth = scene.footprintM.d
  const rooms: RoomSpec[] = []
  const doors = new Map<string, Door>()
  const fixtures: PlanBox[] = []

  for (const room of scene.floor.rooms) {
    const o = originOf(scene, room.id)
    const { w, d } = polygonSizeM(room.polygon)
    rooms.push({ id: room.id, name: room.label, type: PLAN_ROOM_TYPE[room.type], footprint: floorRectToPlan(o.x, o.y, w, d, depth) })

    for (const opening of room.openings) {
      if (doors.has(opening.id)) continue
      const edge = opening.wall_id.slice(-1)
      const off = opening.offset_m
      const len = opening.width_m
      // Local segment along the wall; walls wind counter-clockwise from (0,0).
      const [a, b] =
        edge === 's'
          ? [{ x: off, y: 0 }, { x: off + len, y: 0 }]
          : edge === 'e'
            ? [{ x: w, y: off }, { x: w, y: off + len }]
            : edge === 'n'
              ? [{ x: w - off - len, y: d }, { x: w - off, y: d }]
              : [{ x: 0, y: d - off - len }, { x: 0, y: d - off }]
      const pa = toPlan(o.x + a.x, o.y + a.y, depth)
      const pb = toPlan(o.x + b.x, o.y + b.y, depth)
      const horizontal = edge === 's' || edge === 'n'
      doors.set(opening.id, {
        x: horizontal ? Math.min(pa.x, pb.x) : pa.x,
        y: horizontal ? pa.y : Math.min(pa.y, pb.y),
        length: horizontal ? Math.abs(pb.x - pa.x) : Math.abs(pb.y - pa.y),
        orientation: horizontal ? 'h' : 'v',
        kind: opening.kind,
      })
    }

    fixtures.push(...room.objects.filter((obj) => obj.is_fixed).map((obj) => objectBox(obj, o, depth, true)))
  }
  return { id: 'scene', name, rooms, doors: [...doors.values()], fixtures }
}

/** Movable furniture per room, labelled once per distinct product. */
export function sceneFurniture(scene: Scene): Record<string, PlanBox[]> {
  const depth = scene.footprintM.d
  const out: Record<string, PlanBox[]> = {}
  for (const room of scene.floor.rooms) {
    const seen = new Set<string>()
    out[room.id] = room.objects
      .filter((obj) => !obj.is_fixed)
      .map((obj) => {
        const first = !seen.has(obj.label)
        seen.add(obj.label)
        return objectBox(obj, originOf(scene, room.id), depth, first)
      })
  }
  return out
}

export interface DraftRoomRect {
  id: string
  name: string
  type: RoomType
  x: number
  y: number
  w: number
  d: number
}

/**
 * Unsaved partition preview: rooms from the draft, fixtures and openings from
 * the saved plan. Openings that no longer sit on a drafted room edge are hidden
 * (the server will reject those edits rather than move them).
 */
export function draftPlan(saved: FloorPlan, rects: DraftRoomRect[], depthM: number): FloorPlan {
  const rooms: RoomSpec[] = rects.map((r) => ({ id: r.id, name: r.name, type: PLAN_ROOM_TYPE[r.type], footprint: floorRectToPlan(r.x, r.y, r.w, r.d, depthM) }))
  const onEdge = (door: Door) =>
    rooms.some(({ footprint: f }) =>
      door.orientation === 'v'
        ? (Math.abs(f.x - door.x) < EDGE_TOLERANCE_IN || Math.abs(f.x + f.w - door.x) < EDGE_TOLERANCE_IN) && door.y >= f.y - EDGE_TOLERANCE_IN && door.y + door.length <= f.y + f.h + EDGE_TOLERANCE_IN
        : (Math.abs(f.y - door.y) < EDGE_TOLERANCE_IN || Math.abs(f.y + f.h - door.y) < EDGE_TOLERANCE_IN) && door.x >= f.x - EDGE_TOLERANCE_IN && door.x + door.length <= f.x + f.w + EDGE_TOLERANCE_IN,
    )
  return { ...saved, rooms, doors: (saved.doors ?? []).filter(onEdge) }
}
