import type { RoomSpec } from './floorplan'
import { FURNITURE_BY_ROOM_TYPE } from '@/data/furnitureCatalog'
import { matchProduct, type InventoryProduct } from '@/data/inventory'

export interface ShoppingListLine {
  roomId: string
  roomName: string
  itemId: string
  itemLabel: string
  quantity: number
  product: InventoryProduct | null
}

export interface RoomShoppingGroup {
  roomId: string
  roomName: string
  lines: ShoppingListLine[]
  subtotalCents: number
}

/** One line per selected item type per room, each matched to a real product where the inventory covers it. */
export function buildShoppingList(rooms: RoomSpec[], getQuantity: (roomId: string, itemId: string) => number): RoomShoppingGroup[] {
  const groups: RoomShoppingGroup[] = []
  for (const room of rooms) {
    const options = FURNITURE_BY_ROOM_TYPE[room.type] ?? []
    const lines: ShoppingListLine[] = []
    for (const option of options) {
      const quantity = getQuantity(room.id, option.id)
      if (quantity <= 0) continue
      lines.push({
        roomId: room.id,
        roomName: room.name,
        itemId: option.id,
        itemLabel: option.label,
        quantity,
        product: matchProduct(option.id),
      })
    }
    if (lines.length > 0) {
      const subtotalCents = lines.reduce((sum, l) => sum + (l.product?.priceCents ?? 0) * l.quantity, 0)
      groups.push({ roomId: room.id, roomName: room.name, lines, subtotalCents })
    }
  }
  return groups
}
