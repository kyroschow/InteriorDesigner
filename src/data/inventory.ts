import bedsData from '../../inventory/beds.json'
import sofaData from '../../inventory/sofa.json'
import nightstandData from '../../inventory/nightstand.json'
import tvstandData from '../../inventory/tvstand.json'
import sinksData from '../../inventory/sinks.json'

export interface InventoryProduct {
  name: string
  category: string
  url: string
  imageUrls: string[]
  priceCents: number
  dimsMm: { w: number; d: number; h: number }
  colorHex: string
  colorName: string
  materials: string[]
  styleTags: string[]
  itemNo?: string
  typeName: string
  description: string
  featureTags: string[]
}

/**
 * Maps our furniture-catalog item ids to the real inventory/*.json file that
 * covers them. dining-table, dining-chair, toilet, and shower have no entry —
 * there's no matching category in the inventory yet (dining.json only has
 * bundled table+chair sets, and there's no toilet/shower file at all).
 */
const INVENTORY_BY_ITEM_ID: Partial<Record<string, InventoryProduct[]>> = {
  bed: bedsData as InventoryProduct[],
  couch: sofaData as InventoryProduct[],
  nightstand: nightstandData as InventoryProduct[],
  'tv-stand': tvstandData as InventoryProduct[],
  sink: sinksData as InventoryProduct[],
}

/** Every real product available for a catalog item id, cheapest first — empty if there's no inventory for it yet. */
export function getProductOptions(itemId: string): InventoryProduct[] {
  const products = INVENTORY_BY_ITEM_ID[itemId]
  if (!products) return []
  return [...products].sort((a, b) => a.priceCents - b.priceCents)
}

/** 14900 -> "$149.00" */
export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
