import type { PlacedItem } from './furniturePlacement'
import { getProductOptions } from '@/data/inventory'

/**
 * Swaps a generic catalog label ("Couch") for the actual matched product name
 * ("GLOSTAD") wherever real inventory covers it, so the floor plan reflects
 * what's actually being bought, not just its category. Items with no
 * inventory match (dining table/chair, toilet, shower) keep their generic
 * label — showing a fake product name would be worse than a plain one.
 */
export function withProductLabels(
  furniture: Record<string, PlacedItem[]>,
  getProductChoice: (roomId: string, itemId: string) => number,
): Record<string, PlacedItem[]> {
  const result: Record<string, PlacedItem[]> = {}
  for (const [roomId, items] of Object.entries(furniture)) {
    result[roomId] = items.map((item) => {
      if (!item.showLabel) return item
      const options = getProductOptions(item.itemId)
      if (options.length === 0) return item
      const index = Math.min(getProductChoice(roomId, item.itemId), options.length - 1)
      return { ...item, label: options[index].name }
    })
  }
  return result
}
