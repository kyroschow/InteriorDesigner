import type { Requirement, RoomDefinition } from '../domain/types.ts'
import { rectangleSize } from '../rooms/reconstruct.ts'
import type { Catalog, CatalogItem } from './load.ts'

export interface CandidateResult {
  items: CatalogItem[]
  rejected: Record<string, number>
}

/**
 * Hard filters for one requirement in one room: type, room eligibility, colors
 * (inventory items only; standard-size items have no color), max dimensions and a
 * simple does-it-fit-the-room check in either orientation.
 */
export function candidatesFor(catalog: Catalog, requirement: Requirement, room: RoomDefinition): CandidateResult {
  const rejected: Record<string, number> = {}
  const reject = (reason: string) => {
    rejected[reason] = (rejected[reason] ?? 0) + 1
    return false
  }
  const size = rectangleSize(room.polygon)
  const roomMin = size ? Math.min(size.w, size.d) / 1000 : Infinity
  const roomMax = size ? Math.max(size.w, size.d) / 1000 : Infinity
  const colors = requirement.allowedColors ?? []
  const max = requirement.maxDimensionsM

  const items = catalog.items.filter((item) => {
    if (item.objectType !== requirement.objectType) return false
    if (!item.roomTypes.includes(room.type)) return reject('room_type')
    if (colors.length > 0 && item.source === 'inventory' && !item.colorFamilies.some((c) => colors.includes(c))) return reject('color')
    const f = item.footprint
    if (max && (f.w > max.w || f.d > max.d || f.h > max.h)) return reject('max_dimensions')
    if (Math.min(f.w, f.d) > roomMin || Math.max(f.w, f.d) > roomMax) return reject('does_not_fit_room')
    return true
  })
  return { items, rejected }
}

/** Rooms a requirement may be placed in. */
export function eligibleRooms(catalog: Catalog, requirement: Requirement, rooms: RoomDefinition[]): RoomDefinition[] {
  const spec = catalog.types[requirement.objectType]
  const pool = requirement.roomId ? rooms.filter((r) => r.id === requirement.roomId) : rooms
  return pool.filter((r) => spec.roomTypes.includes(r.type))
}
