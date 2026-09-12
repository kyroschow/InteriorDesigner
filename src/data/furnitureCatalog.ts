import type { RoomType } from '@/lib/floorplan'

export interface FurnitureOption {
  id: string
  label: string
  max: number
  /** Real-world footprint in inches, used to lay it out on the plan. */
  size: { w: number; h: number }
}

/** What's actually available right now — the real (short) catalog, not a placeholder. */
export const FURNITURE_BY_ROOM_TYPE: Record<RoomType, FurnitureOption[]> = {
  living: [
    { id: 'couch', label: 'Couch', max: 2, size: { w: 84, h: 36 } },
    { id: 'tv-stand', label: 'TV Stand', max: 1, size: { w: 60, h: 18 } },
  ],
  kitchen: [
    { id: 'dining-table', label: 'Dining Table', max: 1, size: { w: 60, h: 36 } },
    { id: 'dining-chair', label: 'Dining Chair', max: 6, size: { w: 18, h: 18 } },
  ],
  bedroom: [
    { id: 'bed', label: 'Bed', max: 1, size: { w: 60, h: 80 } },
    { id: 'nightstand', label: 'Night Stand', max: 2, size: { w: 20, h: 16 } },
    { id: 'tv-stand', label: 'TV Stand', max: 1, size: { w: 48, h: 16 } },
  ],
  bathroom: [
    { id: 'toilet', label: 'Toilet', max: 1, size: { w: 20, h: 28 } },
    { id: 'shower', label: 'Shower', max: 1, size: { w: 36, h: 36 } },
    { id: 'sink', label: 'Sink', max: 1, size: { w: 24, h: 20 } },
  ],
  // No furniture catalog for halls yet.
  hall: [],
}
