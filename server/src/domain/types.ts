/**
 * Canonical scene and application records.
 *
 * Geometry convention (API and storage): meters, rounded to 3 decimals.
 * Room-local coordinates have their origin at the room's min corner, +X right,
 * +Y up. `rot` is clockwise degrees from facing +Y; the pose origin is the
 * footprint center. Internally the rules engine works in integer millimeters.
 */

export const ROOM_TYPES = ['living_room', 'bedroom', 'kitchen', 'bathroom'] as const
export type RoomType = (typeof ROOM_TYPES)[number]

export const OBJECT_TYPES = [
  'bed',
  'dresser',
  'nightstand',
  'tv_stand',
  'sofa',
  'dining_table',
  'dining_chair',
  'kitchen_counter',
  'sink',
  'shower',
  'toilet',
] as const
export type ObjectType = (typeof OBJECT_TYPES)[number]

export type Rotation = 0 | 90 | 180 | 270
export const ROTATIONS: Rotation[] = [0, 90, 180, 270]

export interface Point {
  x: number
  y: number
}

export interface Dimensions {
  w: number
  d: number
  h: number
}

export interface Pose {
  x: number
  y: number
  z: number
  rot: Rotation
}

export type WallSide = 'bottom' | 'right' | 'top' | 'left'
export const WALL_SIDES: WallSide[] = ['bottom', 'right', 'top', 'left']

export interface Wall {
  id: `wall-${WallSide}`
  side: WallSide
  a: Point
  b: Point
  length_m: number
  is_exterior: boolean
}

export type OpeningKind = 'door' | 'doorway' | 'window'

/**
 * An opening as seen from one room. `offset_m` is the coordinate along the wall
 * of the opening's lower end: x for bottom/top walls, y for left/right walls.
 */
export interface Opening {
  id: string
  kind: OpeningKind
  wall_id: Wall['id']
  offset_m: number
  width_m: number
  height_m: number
  sill_m: number
  /** Doors only: whether the leaf swings into this room. */
  swing: 'into_room' | 'away' | 'none'
  leads_to: string
}

export interface PlacedObject {
  /** Requirement instance ID, e.g. `req-bed#1`. */
  id: string
  requirementId: string
  roomId: string
  type: ObjectType
  itemId: string
  name: string
  source: 'inventory' | 'default'
  priceMinor: number | null
  pose: Pose
  footprint: Dimensions
  is_fixed: false
}

export interface Room {
  id: string
  label: string
  type: RoomType
  polygon: Point[]
  ceiling_height_m: number
  area_m2: number
  walls: Wall[]
  openings: Opening[]
  objects: PlacedObject[]
}

export interface Floor {
  id: string
  level: number
  height_m: number
  width_m: number
  depth_m: number
  rooms: Room[]
  stairs: []
}

export interface RoomTransform {
  roomId: string
  origin: Point
}

/** An opening in floor coordinates, the single source of truth for the demo shell. */
export interface FloorOpening {
  id: string
  kind: OpeningKind
  /** Segment on a wall line (axis-aligned). */
  a: Point
  b: Point
  height_m: number
  sill_m: number
  /** Room IDs this opening belongs to; `exterior` for the outside. */
  connects: [string, string]
  /** Doors only: the room the leaf swings into. */
  swingsInto: string | null
}

export interface RoomDefinition {
  id: string
  label: string
  type: RoomType
  polygon: Point[]
}

export interface Requirement {
  id: string
  objectType: ObjectType
  quantity: number
  roomId: string | null
  allowedColors?: string[]
  maxDimensionsM?: Dimensions
}

export interface Configuration {
  revision: number
  prompt: string
  budget: { amountMinor: number; currency: 'USD' } | null
  requirements: Requirement[]
  roomInstructions: { roomId: string; note: string }[]
}

export interface ProjectRecord {
  id: string
  name: string
  unitSystem: 'metric' | 'imperial'
  mode: 'upload' | 'scratch'
  demoLayoutId: 'four-room-v1'
  revision: number
  floorPlanAssetId: string | null
  rooms: RoomDefinition[]
  roomTransforms: RoomTransform[]
  configuration: Configuration
  activeLayoutId: string | null
  /** Set when saved geometry/configuration no longer matches the active layout. */
  stale: { since: string; reason: string } | null
  createdAt: string
  updatedAt: string
}
