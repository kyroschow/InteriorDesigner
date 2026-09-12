import type { Rect } from '../geometry/rect.ts'

export interface Obstacle {
  rect: Rect
  label: string
}

export interface NarrowPoint {
  x: number
  y: number
  nextTo: string
}

export interface PathReach {
  /** Widest walkway width (mm) along the best path from the primary door; 0 if unreachable. */
  widthMm: number
  narrowPoint: NarrowPoint | null
}

export interface WalkwayAnalysis {
  primaryDoorId: string | null
  walkableAreaPct: number
  doorReach: Map<string, PathReach>
  reachZone(zone: Rect): PathReach
}

/**
 * Walkway analysis on a grid over one rectangular room (all values in mm).
 *
 * Each cell stores its Chebyshev clearance to the nearest obstacle (furniture
 * footprints and wall segments; door openings are gaps in the walls), i.e. the
 * largest square walker that fits centered there. A max-bottleneck (widest path)
 * search from the primary door then gives, for every cell, the widest walker
 * that can reach it. Half a cell of slack absorbs grid alignment.
 */
export function analyzeWalkway(
  roomW: number,
  roomD: number,
  obstacles: Obstacle[],
  doors: { id: string; seed: Rect }[],
  walkwayMm: number,
  gridMm: number,
): WalkwayAnalysis {
  const nx = Math.max(1, Math.ceil(roomW / gridMm))
  const ny = Math.max(1, Math.ceil(roomD / gridMm))
  const count = nx * ny
  const half = gridMm / 2
  const clearance = new Float64Array(count)
  const nearest = new Array<string>(count)

  for (let j = 0; j < ny; j++) {
    const cy = Math.min((j + 0.5) * gridMm, roomD - 1)
    for (let i = 0; i < nx; i++) {
      const cx = Math.min((i + 0.5) * gridMm, roomW - 1)
      let best = Infinity
      let label = ''
      for (const o of obstacles) {
        const dx = Math.max(o.rect.x0 - cx, 0, cx - o.rect.x1)
        const dy = Math.max(o.rect.y0 - cy, 0, cy - o.rect.y1)
        const dist = Math.max(dx, dy)
        if (dist < best) {
          best = dist
          label = o.label
        }
      }
      clearance[j * nx + i] = best
      nearest[j * nx + i] = label
    }
  }

  const cellsIn = (r: Rect): number[] => {
    const out: number[] = []
    const i0 = Math.max(0, Math.floor(r.x0 / gridMm))
    const i1 = Math.min(nx - 1, Math.ceil(r.x1 / gridMm) - 1)
    const j0 = Math.max(0, Math.floor(r.y0 / gridMm))
    const j1 = Math.min(ny - 1, Math.ceil(r.y1 / gridMm) - 1)
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const cx = (i + 0.5) * gridMm
        const cy = (j + 0.5) * gridMm
        if (cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1) out.push(j * nx + i)
      }
    }
    return out
  }

  const best = new Float64Array(count).fill(-1)
  const parent = new Int32Array(count).fill(-1)
  const primary = doors[0] ?? null

  if (primary) {
    const heap = new MaxHeap()
    for (const c of cellsIn(primary.seed)) {
      best[c] = clearance[c]
      heap.push(clearance[c], c)
    }
    while (heap.size > 0) {
      const [value, c] = heap.pop()
      if (value < best[c]) continue
      const i = c % nx
      const j = (c - i) / nx
      const neighbors = [i > 0 ? c - 1 : -1, i < nx - 1 ? c + 1 : -1, j > 0 ? c - nx : -1, j < ny - 1 ? c + nx : -1]
      for (const n of neighbors) {
        if (n < 0) continue
        const candidate = Math.min(value, clearance[n])
        if (candidate > best[n]) {
          best[n] = candidate
          parent[n] = c
          heap.push(candidate, n)
        }
      }
    }
  }

  const widthOf = (bottleneck: number) => (bottleneck < 0 ? 0 : Math.max(0, 2 * (bottleneck + half)))

  const narrowPointFrom = (cell: number): NarrowPoint | null => {
    let minCell = cell
    for (let c = cell; c >= 0; c = parent[c]) {
      if (clearance[c] < clearance[minCell]) minCell = c
    }
    const i = minCell % nx
    const j = (minCell - i) / nx
    return { x: (i + 0.5) * gridMm, y: (j + 0.5) * gridMm, nextTo: nearest[minCell] }
  }

  const reachCells = (cells: number[]): PathReach => {
    let bestCell = -1
    for (const c of cells) if (best[c] >= 0 && (bestCell < 0 || best[c] > best[bestCell])) bestCell = c
    if (bestCell < 0) return { widthMm: 0, narrowPoint: null }
    return { widthMm: widthOf(best[bestCell]), narrowPoint: narrowPointFrom(bestCell) }
  }

  const doorReach = new Map<string, PathReach>()
  for (const door of doors) doorReach.set(door.id, reachCells(cellsIn(door.seed)))

  let walkable = 0
  for (let c = 0; c < count; c++) if (best[c] >= 0 && widthOf(best[c]) >= walkwayMm) walkable++

  return {
    primaryDoorId: primary?.id ?? null,
    walkableAreaPct: Math.round((1000 * walkable) / count) / 10,
    doorReach,
    reachZone: (zone: Rect) => {
      const reach = walkwayMm / 2
      return reachCells(cellsIn({ x0: zone.x0 - reach, y0: zone.y0 - reach, x1: zone.x1 + reach, y1: zone.y1 + reach }))
    },
  }
}

class MaxHeap {
  private values: number[] = []
  private ids: number[] = []

  get size() {
    return this.values.length
  }

  push(value: number, id: number) {
    this.values.push(value)
    this.ids.push(id)
    let i = this.values.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.values[p] >= this.values[i]) break
      this.swap(i, p)
      i = p
    }
  }

  pop(): [number, number] {
    const top: [number, number] = [this.values[0], this.ids[0]]
    const lastValue = this.values.pop()!
    const lastId = this.ids.pop()!
    if (this.values.length > 0) {
      this.values[0] = lastValue
      this.ids[0] = lastId
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let largest = i
        if (l < this.values.length && this.values[l] > this.values[largest]) largest = l
        if (r < this.values.length && this.values[r] > this.values[largest]) largest = r
        if (largest === i) break
        this.swap(i, largest)
        i = largest
      }
    }
    return top
  }

  private swap(a: number, b: number) {
    ;[this.values[a], this.values[b]] = [this.values[b], this.values[a]]
    ;[this.ids[a], this.ids[b]] = [this.ids[b], this.ids[a]]
  }
}
