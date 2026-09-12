import type { RoomType } from '@/lib/floorplan'

export interface FurnitureOption {
  id: string
  label: string
  max: number
}

/** What a client can ask for per room type. No AI program synthesis yet (PLAN.md §5) — this is the manual stand-in. */
export const FURNITURE_BY_ROOM_TYPE: Record<RoomType, FurnitureOption[]> = {
  living: [
    { id: 'sofa', label: 'Sofa', max: 2 },
    { id: 'armchair', label: 'Armchair', max: 2 },
    { id: 'coffee-table', label: 'Coffee table', max: 1 },
    { id: 'tv-stand', label: 'TV stand', max: 1 },
    { id: 'rug', label: 'Rug', max: 1 },
  ],
  kitchen: [
    { id: 'dining-table', label: 'Dining table', max: 1 },
    { id: 'dining-chair', label: 'Dining chair', max: 6 },
    { id: 'bar-stool', label: 'Bar stool', max: 4 },
  ],
  bedroom: [
    { id: 'bed', label: 'Bed', max: 1 },
    { id: 'nightstand', label: 'Nightstand', max: 2 },
    { id: 'dresser', label: 'Dresser', max: 1 },
    { id: 'wardrobe', label: 'Wardrobe', max: 1 },
  ],
  bathroom: [
    { id: 'vanity', label: 'Vanity', max: 1 },
    { id: 'storage-cabinet', label: 'Storage cabinet', max: 1 },
  ],
  hall: [
    { id: 'console-table', label: 'Console table', max: 1 },
    { id: 'storage-bench', label: 'Storage bench', max: 1 },
  ],
}
