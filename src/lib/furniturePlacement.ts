/**
 * Deterministic furniture layout — no agent/AI here yet (PLAN.md §5's program
 * synthesis + placement loop doesn't exist). This is the "template baseline"
 * PLAN.md calls for: distribute items around the room's walls rather than
 * stacking everything in one row, since real furniture sits against walls,
 * not piled in a corner. Room-appropriateness is enforced by construction —
 * the catalog only offers a bed to bedrooms, a toilet to bathrooms, etc. —
 * not by an agent judging it.
 *
 * Rooms too short for meaningful left/right wall stacking (a small bathroom,
 * say) fall back to simple rows anchored along the bottom wall instead —
 * distributing to three walls when two of them have no real depth to work
 * with just makes items collide in the corner.
 */
import type { RoomSpec } from './floorplan'
import { rectBottom, rectRight } from './geometry'
import type { FurnitureOption } from '@/data/furnitureCatalog'

export interface PlacedItem {
  id: string
  label: string
  /** False for the 2nd+ instance of the same item in a room — repeated labels crowd into each other. */
  showLabel: boolean
  x: number
  y: number
  w: number
  h: number
  /** Where to draw the label relative to the box, so it never sits over the box or outside the room. */
  labelX: number
  labelY: number
  labelAnchor: 'start' | 'middle' | 'end'
}

const GAP_IN = 8
const SIDE_MARGIN_IN = 10
const BOTTOM_MARGIN_IN = 10
/** Extra top margin so boxes (and their labels, drawn just above them) don't collide with the room's name/area label. */
const TOP_MARGIN_IN = 46
const LABEL_GAP_IN = 5
/** Below this available height, left/right walls have no real room to stack in — use bottom rows instead. */
const MIN_HEIGHT_FOR_SIDE_WALLS_IN = 60

export interface FurnitureSelection {
  option: FurnitureOption
  quantity: number
}

interface FlatItem {
  id: string
  label: string
  showLabel: boolean
  size: { w: number; h: number }
}

function flatten(selections: FurnitureSelection[]): FlatItem[] {
  const out: FlatItem[] = []
  for (const { option, quantity } of selections) {
    for (let i = 0; i < quantity; i++) {
      out.push({ id: `${option.id}-${i}`, label: option.label, showLabel: i === 0, size: option.size })
    }
  }
  return out
}

/** Longer side along the wall, shorter side as depth from it — how furniture actually sits against a wall. */
function orient(size: { w: number; h: number }): { along: number; depth: number } {
  return { along: Math.max(size.w, size.h), depth: Math.min(size.w, size.h) }
}

interface Bounds {
  innerLeft: number
  innerTop: number
  innerRight: number
  innerBottom: number
}

type Wall = 'bottom' | 'left' | 'right'
const WALL_CYCLE: Wall[] = ['bottom', 'left', 'right']

/** Distributes items to bottom/left/right walls in turn. Needs real height to avoid corner collisions. */
function layoutWalls(items: FlatItem[], b: Bounds, scale: number) {
  const gap = GAP_IN * scale
  const cursor: Record<Wall, number> = { bottom: 0, left: 0, right: 0 }
  const placements: PlacedItem[] = []

  // Reserve a clear channel for the bottom wall between whatever depth the left/
  // right columns actually use — otherwise a bottom-wall item (which can run the
  // full room width) visually collides with a left/right item's box or label.
  let leftDepth = 0
  let rightDepth = 0
  items.forEach((item, i) => {
    const wall = WALL_CYCLE[i % WALL_CYCLE.length]
    const depthPx = orient(item.size).depth * scale
    if (wall === 'left') leftDepth = Math.max(leftDepth, depthPx)
    if (wall === 'right') rightDepth = Math.max(rightDepth, depthPx)
  })
  const bottomLeft = b.innerLeft + (leftDepth > 0 ? leftDepth + gap : 0)
  const bottomRight = b.innerRight - (rightDepth > 0 ? rightDepth + gap : 0)

  items.forEach((item, i) => {
    const wall = WALL_CYCLE[i % WALL_CYCLE.length]
    const { along, depth } = orient(item.size)
    const alongPx = along * scale
    const depthPx = depth * scale

    let x: number, y: number, labelX: number, labelY: number
    let labelAnchor: PlacedItem['labelAnchor'] = 'middle'

    if (wall === 'bottom') {
      x = bottomLeft + cursor.bottom
      y = b.innerBottom - depthPx
      labelX = x + alongPx / 2
      labelY = y - LABEL_GAP_IN
    } else if (wall === 'left') {
      x = b.innerLeft
      y = b.innerTop + cursor.left
      labelX = x + depthPx + LABEL_GAP_IN
      labelY = y + alongPx / 2
      labelAnchor = 'start'
    } else {
      x = b.innerRight - depthPx
      y = b.innerTop + cursor.right
      labelX = x - LABEL_GAP_IN
      labelY = y + alongPx / 2
      labelAnchor = 'end'
    }

    const w = wall === 'bottom' ? alongPx : depthPx
    const h = wall === 'bottom' ? depthPx : alongPx
    placements.push({ id: item.id, label: item.label, showLabel: item.showLabel, x, y, w, h, labelX, labelY, labelAnchor })
    cursor[wall] += alongPx + gap
  })

  return { placements, reach: { ...cursor, bottomChannel: bottomRight - bottomLeft } }
}

/** Rows stacked upward from the bottom wall, wrapping when a row runs out of width. For short/squat rooms. */
function layoutBottomRows(items: FlatItem[], b: Bounds, scale: number) {
  const gap = GAP_IN * scale
  const availW = b.innerRight - b.innerLeft

  type RowItem = { item: FlatItem; alongPx: number; depthPx: number; xOffset: number }
  const rows: Array<{ items: RowItem[]; depth: number; width: number }> = [{ items: [], depth: 0, width: 0 }]
  let cursorX = 0

  for (const item of items) {
    const { along, depth } = orient(item.size)
    const alongPx = along * scale
    const depthPx = depth * scale
    let row = rows[rows.length - 1]
    if (row.items.length > 0 && cursorX + alongPx > availW) {
      row = { items: [], depth: 0, width: 0 }
      rows.push(row)
      cursorX = 0
    }
    row.items.push({ item, alongPx, depthPx, xOffset: cursorX })
    row.depth = Math.max(row.depth, depthPx)
    cursorX += alongPx + gap
    row.width = cursorX - gap
  }

  const placements: PlacedItem[] = []
  let yFromBottom = 0
  for (const row of rows) {
    for (const { item, alongPx, depthPx, xOffset } of row.items) {
      const x = b.innerLeft + xOffset
      const y = b.innerBottom - yFromBottom - depthPx
      placements.push({
        id: item.id,
        label: item.label,
        showLabel: item.showLabel,
        x,
        y,
        w: alongPx,
        h: depthPx,
        labelX: x + alongPx / 2,
        labelY: y - LABEL_GAP_IN,
        labelAnchor: 'middle',
      })
    }
    yFromBottom += row.depth + gap
  }

  const totalHeight = Math.max(0, yFromBottom - gap)
  const maxRowWidth = Math.max(0, ...rows.map((r) => r.width))

  return { placements, reach: { height: totalHeight, width: maxRowWidth } }
}

/** Lay out one room's selected furniture as non-overlapping top-view boxes, shrinking to fit if needed. */
export function placeFurniture(room: RoomSpec, selections: FurnitureSelection[]): PlacedItem[] {
  const r = room.footprint
  const b: Bounds = {
    innerLeft: r.x + SIDE_MARGIN_IN,
    innerRight: rectRight(r) - SIDE_MARGIN_IN,
    innerTop: r.y + TOP_MARGIN_IN,
    innerBottom: rectBottom(r) - BOTTOM_MARGIN_IN,
  }
  const availW = b.innerRight - b.innerLeft
  const availH = b.innerBottom - b.innerTop
  if (availW <= 0 || availH <= 0) return []

  const items = flatten(selections)
  if (items.length === 0) return []

  if (availH < MIN_HEIGHT_FOR_SIDE_WALLS_IN) {
    const dry = layoutBottomRows(items, b, 1)
    const scale = Math.min(1, dry.reach.height > 0 ? availH / dry.reach.height : 1, dry.reach.width > 0 ? availW / dry.reach.width : 1)
    return scale >= 1 ? dry.placements : layoutBottomRows(items, b, scale).placements
  }

  const dry = layoutWalls(items, b, 1)
  const scale = Math.min(
    1,
    dry.reach.bottom > 0 ? dry.reach.bottomChannel / dry.reach.bottom : 1,
    dry.reach.left > 0 ? availH / dry.reach.left : 1,
    dry.reach.right > 0 ? availH / dry.reach.right : 1,
  )
  return scale >= 1 ? dry.placements : layoutWalls(items, b, scale).placements
}

/** Ids-with-quantity from a store, resolved against each room's own type's catalog. */
export function placeAllFurniture(
  rooms: RoomSpec[],
  catalogByRoomType: Record<string, FurnitureOption[]>,
  getQuantity: (roomId: string, itemId: string) => number,
): Record<string, PlacedItem[]> {
  const result: Record<string, PlacedItem[]> = {}
  for (const room of rooms) {
    const options = catalogByRoomType[room.type] ?? []
    const selections = options
      .map((option) => ({ option, quantity: getQuantity(room.id, option.id) }))
      .filter((s) => s.quantity > 0)
    result[room.id] = placeFurniture(room, selections)
  }
  return result
}
