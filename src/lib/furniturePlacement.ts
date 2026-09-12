/**
 * Deterministic furniture layout — no agent/AI here yet (PLAN.md §5's program
 * synthesis + placement loop doesn't exist). This is the "template baseline"
 * PLAN.md calls for: pack items into rows inside each room, top-view boxes only.
 * Room-appropriateness is enforced by construction — the catalog only offers a
 * bed to bedrooms, a toilet to bathrooms, etc. — not by an agent judging it.
 */
import type { RoomSpec } from './floorplan'
import { rectBottom } from './geometry'
import type { FurnitureOption } from '@/data/furnitureCatalog'

export interface PlacedItem {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

const GAP_IN = 6
const SIDE_MARGIN_IN = 8
const BOTTOM_MARGIN_IN = 8
/** Extra top margin so boxes don't collide with the room's name/area label. */
const TOP_MARGIN_IN = 40

export interface FurnitureSelection {
  option: FurnitureOption
  quantity: number
}

/** Lay out one room's selected furniture as non-overlapping top-view boxes, shrinking to fit if needed. */
export function placeFurniture(room: RoomSpec, selections: FurnitureSelection[]): PlacedItem[] {
  const r = room.footprint
  const innerW = r.w - SIDE_MARGIN_IN * 2
  const innerH = rectBottom(r) - r.y - TOP_MARGIN_IN - BOTTOM_MARGIN_IN
  if (innerW <= 0 || innerH <= 0) return []

  type LocalBox = { id: string; label: string; x: number; y: number; w: number; h: number }
  const local: LocalBox[] = []
  let cursorX = 0
  let cursorY = 0
  let rowHeight = 0

  for (const { option, quantity } of selections) {
    for (let i = 0; i < quantity; i++) {
      const { w, h } = option.size
      if (cursorX > 0 && cursorX + w > innerW) {
        cursorX = 0
        cursorY += rowHeight + GAP_IN
        rowHeight = 0
      }
      local.push({ id: `${option.id}-${i}`, label: option.label, x: cursorX, y: cursorY, w, h })
      cursorX += w + GAP_IN
      rowHeight = Math.max(rowHeight, h)
    }
  }
  if (local.length === 0) return []

  const contentH = cursorY + rowHeight
  const scale = contentH > innerH ? innerH / contentH : 1
  const originX = r.x + SIDE_MARGIN_IN
  const originY = r.y + TOP_MARGIN_IN

  return local.map((b) => ({
    id: b.id,
    label: b.label,
    x: originX + b.x * scale,
    y: originY + b.y * scale,
    w: b.w * scale,
    h: b.h * scale,
  }))
}

/** Ids-with-quantity, e.g. from a store, resolved against a room-type's catalog. */
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
