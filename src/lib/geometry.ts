/**
 * 2D geometry in integer inches.
 *
 * Plan coordinate system: origin top-left of the canvas world, +x right, +y DOWN
 * (screen orientation). Drafted's editor labels the canvas edges Back (top),
 * Front (bottom), Left, Right — so +y pointing down means "down the screen = toward
 * the Front of the house", which keeps the SVG transform identity-simple.
 */

export interface Vec2 {
  x: number
  y: number
}

/** Axis-aligned rectangle. x,y is the top-left corner. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Polygon = Vec2[]

export const v = (x: number, y: number): Vec2 => ({ x, y })
export const addV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
export const subV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
export const scaleV = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k })
export const eqV = (a: Vec2, b: Vec2): boolean => a.x === b.x && a.y === b.y

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

// ---------------------------------------------------------------- rectangles

export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })
export const rectRight = (r: Rect) => r.x + r.w
export const rectBottom = (r: Rect) => r.y + r.h
export const rectArea = (r: Rect) => r.w * r.h
export const rectCenter = (r: Rect): Vec2 => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** Aspect ratio >= 1 (long side over short side). Used to reject slivers. */
export function aspect(r: Rect): number {
  if (r.w <= 0 || r.h <= 0) return Infinity
  return Math.max(r.w, r.h) / Math.min(r.w, r.h)
}

/** True if the rectangles overlap with positive area (touching edges do NOT count). */
export function rectsOverlap(a: Rect, b: Rect, tolerance = 0): boolean {
  return (
    a.x + tolerance < rectRight(b) &&
    rectRight(a) - tolerance > b.x &&
    a.y + tolerance < rectBottom(b) &&
    rectBottom(a) - tolerance > b.y
  )
}

export function rectContainsRect(outer: Rect, inner: Rect, tolerance = 0): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    rectRight(inner) <= rectRight(outer) + tolerance &&
    rectBottom(inner) <= rectBottom(outer) + tolerance
  )
}

export function rectContainsPoint(r: Rect, p: Vec2): boolean {
  return p.x >= r.x && p.x <= rectRight(r) && p.y >= r.y && p.y <= rectBottom(r)
}

/** Length of the shared border between two touching rects; 0 if they don't touch. */
export function sharedEdgeLength(a: Rect, b: Rect, tolerance = 1): number {
  // vertical shared edge (a's right touches b's left, or vice versa)
  const touchV =
    Math.abs(rectRight(a) - b.x) <= tolerance || Math.abs(rectRight(b) - a.x) <= tolerance
  if (touchV) {
    const overlap = Math.min(rectBottom(a), rectBottom(b)) - Math.max(a.y, b.y)
    if (overlap > 0) return overlap
  }
  const touchH =
    Math.abs(rectBottom(a) - b.y) <= tolerance || Math.abs(rectBottom(b) - a.y) <= tolerance
  if (touchH) {
    const overlap = Math.min(rectRight(a), rectRight(b)) - Math.max(a.x, b.x)
    if (overlap > 0) return overlap
  }
  return 0
}

/** Do these two rects share a wall long enough to hang a door in? */
export function areAdjacent(a: Rect, b: Rect, minLength = 36): boolean {
  return sharedEdgeLength(a, b) >= minLength
}

// ------------------------------------------------------------------ polygons

/** Shoelace area. Positive for clockwise in screen coords (+y down). */
export function polygonArea(poly: Polygon): number {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export function polygonBounds(poly: Polygon): Rect {
  if (poly.length === 0) return rect(0, 0, 0, 0)
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const p of poly) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return rect(minX, minY, maxX - minX, maxY - minY)
}

export function polygonCentroid(poly: Polygon): Vec2 {
  let cx = 0,
    cy = 0,
    a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const cross = p.x * q.y - q.x * p.y
    a += cross
    cx += (p.x + q.x) * cross
    cy += (p.y + q.y) * cross
  }
  a /= 2
  if (Math.abs(a) < 1e-9) {
    const b = polygonBounds(poly)
    return rectCenter(b)
  }
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

/** Ray casting. Points exactly on the boundary are treated as inside. */
export function pointInPolygon(p: Vec2, poly: Polygon): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (pointOnSegment(p, a, b)) return true
    const intersects = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    if (intersects) inside = !inside
  }
  return inside
}

export function pointOnSegment(p: Vec2, a: Vec2, b: Vec2, tolerance = 0.5): boolean {
  const cross = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)
  if (Math.abs(cross) > tolerance * dist(a, b)) return false
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
  if (dot < -tolerance) return false
  const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  return dot <= lenSq + tolerance
}

/** Is the whole rectangle inside the polygon? Corner + edge-midpoint sampling. */
export function rectInPolygon(r: Rect, poly: Polygon): boolean {
  const probes: Vec2[] = [
    { x: r.x, y: r.y },
    { x: rectRight(r), y: r.y },
    { x: r.x, y: rectBottom(r) },
    { x: rectRight(r), y: rectBottom(r) },
    { x: r.x + r.w / 2, y: r.y },
    { x: r.x + r.w / 2, y: rectBottom(r) },
    { x: r.x, y: r.y + r.h / 2 },
    { x: rectRight(r), y: r.y + r.h / 2 },
    rectCenter(r),
  ]
  return probes.every((p) => pointInPolygon(p, poly))
}

/** Translate every vertex. */
export function translatePolygon(poly: Polygon, d: Vec2): Polygon {
  return poly.map((p) => addV(p, d))
}

/** Mirror horizontally about the polygon's own bounding-box centre. */
export function mirrorPolygon(poly: Polygon): Polygon {
  const b = polygonBounds(poly)
  const axis = b.x * 2 + b.w
  return poly.map((p) => ({ x: axis - p.x, y: p.y })).reverse()
}

/** Move the polygon so its bounding-box centre lands on `target`. */
export function recenterPolygon(poly: Polygon, target: Vec2): Polygon {
  const b = polygonBounds(poly)
  const c = rectCenter(b)
  return translatePolygon(poly, subV(target, c))
}

/** Remove collinear and duplicate vertices — keeps edge dimension labels honest. */
export function simplifyPolygon(poly: Polygon, tolerance = 0.5): Polygon {
  const pts = poly.filter((p, i) => !eqV(p, poly[(i + 1) % poly.length]))
  if (pts.length < 4) return pts
  const out: Polygon = []
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - 1 + pts.length) % pts.length]
    const cur = pts[i]
    const next = pts[(i + 1) % pts.length]
    const cross = (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x)
    if (Math.abs(cross) > tolerance) out.push(cur)
  }
  return out.length >= 3 ? out : pts
}

/** Is every edge axis-aligned? Drafted footprints are strictly rectilinear. */
export function isRectilinear(poly: Polygon, tolerance = 0.5): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    if (Math.abs(a.x - b.x) > tolerance && Math.abs(a.y - b.y) > tolerance) return false
  }
  return true
}

/** Edges as [from, to] pairs, for drawing dimension labels and handles. */
export function polygonEdges(poly: Polygon): Array<[Vec2, Vec2]> {
  return poly.map((p, i) => [p, poly[(i + 1) % poly.length]] as [Vec2, Vec2])
}

/**
 * Outward normal of an edge, assuming the polygon winds clockwise in screen
 * coordinates (+y down). Used to push dimension labels outside the shape.
 */
export function edgeNormal(a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  return { x: dy / len, y: -dx / len }
}
