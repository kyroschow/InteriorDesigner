import type { Dimensions, Pose, Rotation, WallSide } from '../domain/types.ts'

/** Axis-aligned rectangle in integer millimeters (x0 < x1, y0 < y1). */
export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Vec {
  x: number
  y: number
}

export type Side = 'front' | 'back' | 'left' | 'right'

export const mm = (m: number): number => Math.round(m * 1000)
export const m = (millimeters: number): number => Math.round(millimeters) / 1000

export function rect(x0: number, y0: number, x1: number, y1: number): Rect {
  return { x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) }
}

export const width = (r: Rect) => r.x1 - r.x0
export const height = (r: Rect) => r.y1 - r.y0
export const area = (r: Rect) => width(r) * height(r)

/** Positive-area intersection; touching edges do not count. */
export function intersection(a: Rect, b: Rect): Rect | null {
  const x0 = Math.max(a.x0, b.x0)
  const y0 = Math.max(a.y0, b.y0)
  const x1 = Math.min(a.x1, b.x1)
  const y1 = Math.min(a.y1, b.y1)
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null
}

export const intersects = (a: Rect, b: Rect) => intersection(a, b) !== null

export function contains(outer: Rect, inner: Rect): boolean {
  return inner.x0 >= outer.x0 && inner.y0 >= outer.y0 && inner.x1 <= outer.x1 && inner.y1 <= outer.y1
}

/** The item's front direction for a rotation (clockwise from +Y). */
export function frontVector(rot: Rotation): Vec {
  switch (rot) {
    case 0:
      return { x: 0, y: 1 }
    case 90:
      return { x: 1, y: 0 }
    case 180:
      return { x: 0, y: -1 }
    case 270:
      return { x: -1, y: 0 }
  }
}

/** Right-hand direction when facing the same way as the item. */
export const rightVector = (rot: Rotation): Vec => {
  const f = frontVector(rot)
  return { x: f.y, y: -f.x }
}

export function sideVector(rot: Rotation, side: Side): Vec {
  const f = frontVector(rot)
  const r = rightVector(rot)
  switch (side) {
    case 'front':
      return f
    case 'back':
      return { x: -f.x, y: -f.y }
    case 'right':
      return r
    case 'left':
      return { x: -r.x, y: -r.y }
  }
}

export function rotationFacing(v: Vec): Rotation {
  if (v.y > 0) return 0
  if (v.x > 0) return 90
  if (v.y < 0) return 180
  return 270
}

/** Plan extents (x span, y span) of a footprint at a rotation, in mm. */
export function planExtents(footprint: Dimensions, rot: Rotation): { ex: number; ey: number } {
  const w = mm(footprint.w)
  const d = mm(footprint.d)
  return rot === 0 || rot === 180 ? { ex: w, ey: d } : { ex: d, ey: w }
}

export function poseRect(pose: Pose, footprint: Dimensions): Rect {
  const { ex, ey } = planExtents(footprint, pose.rot)
  const cx = mm(pose.x)
  const cy = mm(pose.y)
  const x0 = cx - Math.floor(ex / 2)
  const y0 = cy - Math.floor(ey / 2)
  return { x0, y0, x1: x0 + ex, y1: y0 + ey }
}

/** Zone of `depth` mm adjacent to one edge of a rect, in direction `dir`. */
export function zoneBeyond(r: Rect, dir: Vec, depth: number): Rect {
  if (dir.y > 0) return { x0: r.x0, y0: r.y1, x1: r.x1, y1: r.y1 + depth }
  if (dir.y < 0) return { x0: r.x0, y0: r.y0 - depth, x1: r.x1, y1: r.y0 }
  if (dir.x > 0) return { x0: r.x1, y0: r.y0, x1: r.x1 + depth, y1: r.y1 }
  return { x0: r.x0 - depth, y0: r.y0, x1: r.x0, y1: r.y1 }
}

/** The side of the item rect that faces `side`, extended `depth` mm outward. */
export function sideZone(r: Rect, rot: Rotation, side: Side, depth: number): Rect {
  return zoneBeyond(r, sideVector(rot, side), depth)
}

/** Interior normal of a wall of a rectangular room. */
export function wallNormal(side: WallSide): Vec {
  switch (side) {
    case 'bottom':
      return { x: 0, y: 1 }
    case 'right':
      return { x: -1, y: 0 }
    case 'top':
      return { x: 0, y: -1 }
    case 'left':
      return { x: 1, y: 0 }
  }
}

/** Along-wall axis for a wall: x for bottom/top, y for left/right. */
export const wallAxis = (side: WallSide): 'x' | 'y' => (side === 'bottom' || side === 'top' ? 'x' : 'y')

/**
 * Strip of `depth` mm along the inside of a wall, between along-wall coordinates
 * `from` and `to` (mm), for a room of size `roomW` x `roomD` (mm).
 */
export function wallStrip(side: WallSide, from: number, to: number, depth: number, roomW: number, roomD: number): Rect {
  switch (side) {
    case 'bottom':
      return rect(from, 0, to, depth)
    case 'top':
      return rect(from, roomD - depth, to, roomD)
    case 'left':
      return rect(0, from, depth, to)
    case 'right':
      return rect(roomW - depth, from, roomW, to)
  }
}

/** Distance in mm between the item's back edge and the wall it would sit against. */
export function backGapToWall(r: Rect, rot: Rotation, roomW: number, roomD: number): { side: WallSide; gap: number } {
  switch (rot) {
    case 0:
      return { side: 'bottom', gap: r.y0 }
    case 90:
      return { side: 'left', gap: r.x0 }
    case 180:
      return { side: 'top', gap: roomD - r.y1 }
    case 270:
      return { side: 'right', gap: roomW - r.x1 }
  }
}

/** Subtract intervals from [from, to]; returns remaining sorted intervals. */
export function subtractIntervals(from: number, to: number, cuts: [number, number][]): [number, number][] {
  let spans: [number, number][] = [[from, to]]
  for (const [c0, c1] of cuts) {
    const next: [number, number][] = []
    for (const [s0, s1] of spans) {
      if (c1 <= s0 || c0 >= s1) {
        next.push([s0, s1])
        continue
      }
      if (c0 > s0) next.push([s0, c0])
      if (c1 < s1) next.push([c1, s1])
    }
    spans = next
  }
  return spans
}

export const fmt = (millimeters: number) => (millimeters / 1000).toFixed(2)
export const fmtRect = (r: Rect) => `x ${fmt(r.x0)}–${fmt(r.x1)}, y ${fmt(r.y0)}–${fmt(r.y1)}`
