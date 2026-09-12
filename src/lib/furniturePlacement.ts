/**
 * Deterministic furniture layout — no agent/AI here yet (PLAN.md §5's program
 * synthesis + placement loop doesn't exist). This is the "template baseline"
 * PLAN.md calls for, extended with a few hand-coded relationships instead of
 * just distributing every item to walls independently:
 *
 *  - dining chairs surround their table, not scattered to different walls
 *  - seating (couch/bed) faces the TV — 1 piece faces it directly, 2 form an
 *    L, 3 form a U, opening toward the TV wall
 *  - nightstands flank the bed (PLAN.md §5's own canonical relation example:
 *    "nightstand_l relatesTo bed_primary, relation: flanks_left")
 *
 * These are still just fixed rules, not an agent reasoning about the room —
 * they only fire for the specific item combinations coded below. Anything
 * else (bathroom fixtures, a room missing its cluster's anchor item) falls
 * back to the generic wall/row distribution.
 */
import type { RoomSpec } from './floorplan'
import { rectBottom, rectRight } from './geometry'
import type { FurnitureOption } from '@/data/furnitureCatalog'

export interface PlacedItem {
  id: string
  /** The catalog item id (e.g. "couch"), stable across instances — for looking up a matched real product. */
  itemId: string
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
  itemId: string
  label: string
  showLabel: boolean
  size: { w: number; h: number }
}

function flatten(selections: FurnitureSelection[]): FlatItem[] {
  const out: FlatItem[] = []
  for (const { option, quantity } of selections) {
    for (let i = 0; i < quantity; i++) {
      out.push({ id: `${option.id}-${i}`, itemId: option.id, label: option.label, showLabel: i === 0, size: option.size })
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

type Wall = 'top' | 'bottom' | 'left' | 'right'

/** One item's box + label position for sitting against a given wall, `offset` along that wall from its start corner. */
function placeOnWall(wall: Wall, along: number, depth: number, offset: number, b: Bounds) {
  let x: number, y: number, labelX: number, labelY: number
  let labelAnchor: PlacedItem['labelAnchor'] = 'middle'

  if (wall === 'bottom') {
    x = b.innerLeft + offset
    y = b.innerBottom - depth
    labelX = x + along / 2
    labelY = y - LABEL_GAP_IN
  } else if (wall === 'top') {
    x = b.innerLeft + offset
    y = b.innerTop
    labelX = x + along / 2
    labelY = y + depth + LABEL_GAP_IN
  } else if (wall === 'left') {
    x = b.innerLeft
    y = b.innerTop + offset
    labelX = x + depth + LABEL_GAP_IN
    labelY = y + along / 2
    labelAnchor = 'start'
  } else {
    x = b.innerRight - depth
    y = b.innerTop + offset
    labelX = x - LABEL_GAP_IN
    labelY = y + along / 2
    labelAnchor = 'end'
  }

  const w = wall === 'bottom' || wall === 'top' ? along : depth
  const h = wall === 'bottom' || wall === 'top' ? depth : along
  return { x, y, w, h, labelX, labelY, labelAnchor }
}

// ---------------------------------------------------------- relational clusters

/**
 * TV stand anchors the bottom wall; seating (couch or bed) arranges around
 * top/left/right facing it — 1 piece faces it directly, 2 form an L, 3 form
 * a U opening toward the TV.
 */
const SEATING_WALL_CYCLE: Wall[] = ['top', 'left', 'right']

function placeFacingTv(b: Bounds, tv: FurnitureSelection | undefined, seating: FurnitureSelection | undefined): PlacedItem[] {
  const placements: PlacedItem[] = []
  const availW = b.innerRight - b.innerLeft
  const availH = b.innerBottom - b.innerTop

  if (tv) {
    const { along, depth } = orient(tv.option.size)
    const offset = Math.max(0, (availW - along) / 2)
    const pos = placeOnWall('bottom', along, depth, offset, b)
    placements.push({ id: `${tv.option.id}-0`, itemId: tv.option.id, label: tv.option.label, showLabel: true, ...pos })
  }

  if (seating) {
    const { along, depth } = orient(seating.option.size)
    for (let i = 0; i < seating.quantity; i++) {
      const wall = SEATING_WALL_CYCLE[i % SEATING_WALL_CYCLE.length]
      const span = wall === 'top' ? availW : availH
      const offset = Math.max(0, (span - along) / 2)
      const pos = placeOnWall(wall, along, depth, offset, b)
      placements.push({
        id: `${seating.option.id}-${i}`,
        itemId: seating.option.id,
        label: seating.option.label,
        showLabel: i === 0,
        ...pos,
      })
    }
  }

  return placements
}

/** Nightstands sit flush against the bed's two sides, vertically centered on it — PLAN.md's flanks_left/flanks_right. */
function placeNightstandsFlankingBed(bed: PlacedItem, nightstand: FurnitureSelection): PlacedItem[] {
  const placements: PlacedItem[] = []
  const sides: Array<'left' | 'right'> = ['left', 'right']
  for (let i = 0; i < nightstand.quantity; i++) {
    const side = sides[i % 2]
    const { w, h } = nightstand.option.size
    const x = side === 'left' ? bed.x - GAP_IN - w : bed.x + bed.w + GAP_IN
    const y = bed.y + (bed.h - h) / 2
    placements.push({
      id: `${nightstand.option.id}-${i}`,
      itemId: nightstand.option.id,
      label: nightstand.option.label,
      showLabel: i === 0,
      x,
      y,
      w,
      h,
      labelX: side === 'left' ? x - LABEL_GAP_IN : x + w + LABEL_GAP_IN,
      labelY: y + h / 2,
      labelAnchor: side === 'left' ? 'end' : 'start',
    })
  }
  return placements
}

function placeBedroomCluster(
  b: Bounds,
  bed: FurnitureSelection | undefined,
  nightstand: FurnitureSelection | undefined,
  tv: FurnitureSelection | undefined,
): PlacedItem[] {
  const placements = placeFacingTv(b, tv, bed)
  const bedPlacement = bed ? placements.find((p) => p.itemId === bed.option.id) : undefined

  if (nightstand) {
    if (bedPlacement) {
      placements.push(...placeNightstandsFlankingBed(bedPlacement, nightstand))
    } else {
      // No bed to flank (rare) — just stack them down the left wall.
      const { along, depth } = orient(nightstand.option.size)
      for (let i = 0; i < nightstand.quantity; i++) {
        const pos = placeOnWall('left', along, depth, i * (along + GAP_IN), b)
        placements.push({
          id: `${nightstand.option.id}-${i}`,
          itemId: nightstand.option.id,
          label: nightstand.option.label,
          showLabel: i === 0,
          ...pos,
        })
      }
    }
  }

  return placements
}

type TableSide = 'bottom' | 'top' | 'right' | 'left'
/** Long sides of the table first (where most chairs realistically go), then the ends. */
const TABLE_SIDE_CYCLE: TableSide[] = ['bottom', 'top', 'right', 'left']

/** Chairs surround the table on whichever sides they're assigned to, centered along each side, table centered in the room. */
function placeTableCluster(b: Bounds, table: FurnitureSelection, chairs: FurnitureSelection | undefined): PlacedItem[] {
  const placements: PlacedItem[] = []
  const chairSize = chairs?.option.size ?? { w: 18, h: 18 }
  const chairDepth = Math.min(chairSize.w, chairSize.h)
  const chairAlong = Math.max(chairSize.w, chairSize.h)

  const sideAssignments: TableSide[] = []
  if (chairs) {
    for (let i = 0; i < chairs.quantity; i++) sideAssignments.push(TABLE_SIDE_CYCLE[i % TABLE_SIDE_CYCLE.length])
  }
  const hasSide = (s: TableSide) => sideAssignments.includes(s)

  const tableW = table.option.size.w
  const tableH = table.option.size.h
  const reserveTop = hasSide('top') ? chairDepth + GAP_IN : 0
  const reserveBottom = hasSide('bottom') ? chairDepth + GAP_IN : 0
  const reserveLeft = hasSide('left') ? chairDepth + GAP_IN : 0
  const reserveRight = hasSide('right') ? chairDepth + GAP_IN : 0

  const clusterW = tableW + reserveLeft + reserveRight
  const clusterH = tableH + reserveTop + reserveBottom
  const availW = b.innerRight - b.innerLeft
  const availH = b.innerBottom - b.innerTop
  const scale = Math.min(1, clusterW > 0 ? availW / clusterW : 1, clusterH > 0 ? availH / clusterH : 1)
  const s = (n: number) => n * scale

  const tableX = b.innerLeft + s(reserveLeft) + (availW - s(clusterW)) / 2
  const tableY = b.innerTop + s(reserveTop) + (availH - s(clusterH)) / 2
  const tableWScaled = s(tableW)
  const tableHScaled = s(tableH)

  placements.push({
    id: `${table.option.id}-0`,
    itemId: table.option.id,
    label: table.option.label,
    showLabel: true,
    x: tableX,
    y: tableY,
    w: tableWScaled,
    h: tableHScaled,
    labelX: tableX + tableWScaled / 2,
    labelY: tableY - LABEL_GAP_IN,
    labelAnchor: 'middle',
  })

  if (!chairs) return placements

  const bySide = new Map<TableSide, number[]>()
  sideAssignments.forEach((side, i) => {
    if (!bySide.has(side)) bySide.set(side, [])
    bySide.get(side)!.push(i)
  })

  for (const [side, indices] of bySide) {
    const cw = s(chairAlong)
    const cd = s(chairDepth)
    const totalLen = indices.length * cw + (indices.length - 1) * GAP_IN

    if (side === 'bottom' || side === 'top') {
      let cursor = tableX + tableWScaled / 2 - totalLen / 2
      const y = side === 'bottom' ? tableY + tableHScaled + GAP_IN : tableY - GAP_IN - cd
      for (const chairIndex of indices) {
        placements.push({
          id: `${chairs.option.id}-${chairIndex}`,
          itemId: chairs.option.id,
          label: chairs.option.label,
          showLabel: chairIndex === 0,
          x: cursor,
          y,
          w: cw,
          h: cd,
          labelX: cursor + cw / 2,
          labelY: side === 'bottom' ? y + cd + LABEL_GAP_IN : y - LABEL_GAP_IN,
          labelAnchor: 'middle',
        })
        cursor += cw + GAP_IN
      }
    } else {
      let cursor = tableY + tableHScaled / 2 - totalLen / 2
      const x = side === 'right' ? tableX + tableWScaled + GAP_IN : tableX - GAP_IN - cd
      for (const chairIndex of indices) {
        placements.push({
          id: `${chairs.option.id}-${chairIndex}`,
          itemId: chairs.option.id,
          label: chairs.option.label,
          showLabel: chairIndex === 0,
          x,
          y: cursor,
          w: cd,
          h: cw,
          labelX: side === 'right' ? x + cd + LABEL_GAP_IN : x - LABEL_GAP_IN,
          labelY: cursor + cw / 2,
          labelAnchor: side === 'right' ? 'start' : 'end',
        })
        cursor += cw + GAP_IN
      }
    }
  }

  return placements
}

// -------------------------------------------------------------- generic fallback

const WALL_CYCLE: Wall[] = ['bottom', 'left', 'right']

/** Distributes items to bottom/left/right walls in turn. Needs real height to avoid corner collisions. */
function layoutWalls(items: FlatItem[], b: Bounds, scale: number) {
  const gap = GAP_IN * scale
  const cursor: Record<Wall, number> = { top: 0, bottom: 0, left: 0, right: 0 }
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
    const offset = wall === 'bottom' ? bottomLeft - b.innerLeft + cursor.bottom : cursor[wall]
    const pos = placeOnWall(wall, alongPx, depthPx, offset, b)

    placements.push({ id: item.id, itemId: item.itemId, label: item.label, showLabel: item.showLabel, ...pos })
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
        itemId: item.itemId,
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

function placeGeneric(b: Bounds, selections: FurnitureSelection[]): PlacedItem[] {
  const availW = b.innerRight - b.innerLeft
  const availH = b.innerBottom - b.innerTop
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

// --------------------------------------------------------------------- entry

/** Lay out one room's selected furniture as non-overlapping top-view boxes, shrinking to fit if needed. */
export function placeFurniture(room: RoomSpec, selections: FurnitureSelection[]): PlacedItem[] {
  const r = room.footprint
  const b: Bounds = {
    innerLeft: r.x + SIDE_MARGIN_IN,
    innerRight: rectRight(r) - SIDE_MARGIN_IN,
    innerTop: r.y + TOP_MARGIN_IN,
    innerBottom: rectBottom(r) - BOTTOM_MARGIN_IN,
  }
  if (b.innerRight <= b.innerLeft || b.innerBottom <= b.innerTop) return []

  const byId = new Map(selections.map((s) => [s.option.id, s]))

  if (room.type === 'kitchen' && byId.has('dining-table')) {
    return placeTableCluster(b, byId.get('dining-table')!, byId.get('dining-chair'))
  }
  if (room.type === 'living' && byId.has('tv-stand')) {
    return placeFacingTv(b, byId.get('tv-stand'), byId.get('couch'))
  }
  if (room.type === 'bedroom' && (byId.has('bed') || byId.has('tv-stand'))) {
    return placeBedroomCluster(b, byId.get('bed'), byId.get('nightstand'), byId.get('tv-stand'))
  }

  return placeGeneric(b, selections)
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
