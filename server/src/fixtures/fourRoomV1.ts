import type { FloorOpening, RoomDefinition, RoomTransform } from '../domain/types.ts'

/**
 * Demo shell `four-room-v1`: a 10 m x 8 m floor, 2.7 m ceilings, four rooms.
 * Openings live in floor coordinates and are the single source of truth;
 * per-room walls/openings are derived by rooms/reconstruct.ts.
 */
export const FOUR_ROOM_V1 = {
  id: 'four-room-v1',
  widthM: 10,
  depthM: 8,
  ceilingHeightM: 2.7,
  provenance: { source: 'demo', fixtureSetId: 'four-room-v1' },
} as const

const rectPolygon = (w: number, d: number) => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: d },
  { x: 0, y: d },
]

export const DEMO_ROOMS: RoomDefinition[] = [
  { id: 'room-1', label: 'Living room', type: 'living_room', polygon: rectPolygon(6, 4) },
  { id: 'room-2', label: 'Kitchen', type: 'kitchen', polygon: rectPolygon(4, 4) },
  { id: 'room-3', label: 'Bedroom', type: 'bedroom', polygon: rectPolygon(6, 4) },
  { id: 'room-4', label: 'Bathroom', type: 'bathroom', polygon: rectPolygon(4, 4) },
]

export const DEMO_TRANSFORMS: RoomTransform[] = [
  { roomId: 'room-1', origin: { x: 0, y: 0 } },
  { roomId: 'room-2', origin: { x: 6, y: 0 } },
  { roomId: 'room-3', origin: { x: 0, y: 4 } },
  { roomId: 'room-4', origin: { x: 6, y: 4 } },
]

export const DEMO_OPENINGS: FloorOpening[] = [
  {
    id: 'door-entry',
    kind: 'door',
    a: { x: 0.8, y: 0 },
    b: { x: 1.7, y: 0 },
    height_m: 2.03,
    sill_m: 0,
    connects: ['room-1', 'exterior'],
    swingsInto: 'room-1',
  },
  {
    id: 'doorway-living-kitchen',
    kind: 'doorway',
    a: { x: 6, y: 1.5 },
    b: { x: 6, y: 2.5 },
    height_m: 2.1,
    sill_m: 0,
    connects: ['room-1', 'room-2'],
    swingsInto: null,
  },
  {
    id: 'door-living-bedroom',
    kind: 'door',
    a: { x: 4.6, y: 4 },
    b: { x: 5.5, y: 4 },
    height_m: 2.03,
    sill_m: 0,
    connects: ['room-1', 'room-3'],
    swingsInto: 'room-3',
  },
  {
    id: 'door-bedroom-bath',
    kind: 'door',
    a: { x: 6, y: 4.5 },
    b: { x: 6, y: 5.4 },
    height_m: 2.03,
    sill_m: 0,
    connects: ['room-3', 'room-4'],
    swingsInto: 'room-4',
  },
  {
    id: 'window-living',
    kind: 'window',
    a: { x: 3, y: 0 },
    b: { x: 5, y: 0 },
    height_m: 1.2,
    sill_m: 0.9,
    connects: ['room-1', 'exterior'],
    swingsInto: null,
  },
  {
    id: 'window-kitchen',
    kind: 'window',
    a: { x: 7.5, y: 0 },
    b: { x: 9, y: 0 },
    height_m: 1.0,
    sill_m: 1.05,
    connects: ['room-2', 'exterior'],
    swingsInto: null,
  },
  {
    id: 'window-bedroom',
    kind: 'window',
    a: { x: 1.5, y: 8 },
    b: { x: 3.5, y: 8 },
    height_m: 1.2,
    sill_m: 0.9,
    connects: ['room-3', 'exterior'],
    swingsInto: null,
  },
  {
    id: 'window-bath',
    kind: 'window',
    a: { x: 8.5, y: 8 },
    b: { x: 9.3, y: 8 },
    height_m: 0.6,
    sill_m: 1.5,
    connects: ['room-4', 'exterior'],
    swingsInto: null,
  },
]
