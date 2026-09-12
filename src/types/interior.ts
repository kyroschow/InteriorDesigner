/**
 * API contracts for `/api/v1`, per docs/design/simplified-scope.md.
 *
 * Request types mirror docs/design/schemas/request-bodies.schema.json (objects
 * there reject unknown properties, so never add fields to them). Response types
 * mirror what server/ returns (projects/service.ts `present`, db/store.ts
 * records, rules/engine.ts report).
 *
 * Geometry is meters, 3 decimals, room-local, Y up. `rot` is degrees clockwise
 * from the front facing +Y. Pose origin is the footprint center.
 */

export type UnitSystem = 'metric' | 'imperial'
export type ProjectMode = 'upload' | 'scratch'

export const ROOM_TYPES = ['living_room', 'bedroom', 'kitchen', 'bathroom'] as const
export type RoomType = (typeof ROOM_TYPES)[number]
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living_room: 'Living room',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
}

export const OBJECT_TYPES = ['bed', 'dresser', 'nightstand', 'tv_stand', 'sofa', 'dining_table', 'dining_chair', 'kitchen_counter', 'sink', 'shower', 'toilet'] as const
export type ObjectType = (typeof OBJECT_TYPES)[number]

/** Catalog color families, in the server's order. */
export const COLOR_FAMILIES = ['white', 'black', 'gray', 'beige', 'brown', 'natural', 'blue', 'green'] as const

export const DEMO_LAYOUT_ID = 'four-room-v1'
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const ACCEPTED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
export const MAX_TEXT_LENGTH = 4000

export interface Point {
  x: number
  y: number
}

export interface Dimensions {
  w: number
  d: number
  h: number
}

export type Rotation = 0 | 90 | 180 | 270

export interface Pose {
  x: number
  y: number
  z: number
  rot: Rotation
}

// ---------------------------------------------------------------- requests

export interface CreateProjectRequest {
  name: string
  unitSystem: UnitSystem
  mode: ProjectMode
  demoLayoutId: typeof DEMO_LAYOUT_ID
}

export interface UpdateProjectRequest {
  expectedRevision: number
  name?: string
  unitSystem?: UnitSystem
}

export interface RoomEdit {
  id: string
  label: string
  type: RoomType
  polygon: Point[]
}

export interface RoomTransform {
  roomId: string
  origin: Point
}

export interface ReplaceRoomsRequest {
  expectedRevision: number
  rooms: RoomEdit[]
  roomTransforms: RoomTransform[]
}

export interface Budget {
  amountMinor: number
  currency: 'USD'
}

export interface Requirement {
  id: string
  objectType: ObjectType
  quantity: number
  /** null lets the planner choose an eligible room; it never changes the quantity. */
  roomId: string | null
  /** Color families; empty or absent means any color. */
  allowedColors?: string[]
  maxDimensionsM?: Dimensions
}

export interface RoomInstruction {
  roomId: string
  note: string
}

export interface Configuration {
  prompt: string
  budget?: Budget | null
  requirements: Requirement[]
  roomInstructions: RoomInstruction[]
}

export interface ReplaceConfigurationRequest {
  expectedRevision: number
  configuration: Configuration
}

export interface UpdateRoomNoteRequest {
  expectedRevision: number
  note: string
}

export type GenerationScope = { kind: 'home' } | { kind: 'room'; roomId: string }

export interface CreateGenerationRequest {
  expectedRevision: number
  configurationRevision: number
  scope: GenerationScope
}

// ------------------------------------------------------------------- scene

export type WallSide = 'bottom' | 'right' | 'top' | 'left'

export interface Wall {
  id: `wall-${WallSide}`
  side: WallSide
  a: Point
  b: Point
  length_m: number
  is_exterior: boolean
}

export interface Opening {
  id: string
  kind: 'door' | 'doorway' | 'window'
  wall_id: Wall['id']
  /** Along-wall coordinate of the opening's lower end: x on bottom/top walls, y on left/right. */
  offset_m: number
  width_m: number
  height_m: number
  sill_m: number
  swing: 'into_room' | 'away' | 'none'
  /** Room id, or `exterior`. */
  leads_to: string
}

export interface PlacedObject {
  /** Requirement instance id, e.g. `req-bed#1`. */
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

// --------------------------------------------------------------- responses

export interface ApiErrorDetail {
  path?: string
  code: string
  message?: string
  roomId?: string
  requirementId?: string
  [key: string]: unknown
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: ApiErrorDetail[] }
}

export interface Asset {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  /** `/api/v1/projects/:id/assets/:assetId`; null when the backend kept metadata only (the mock). */
  downloadUrl: string | null
}

export type RoomStatus = 'unconfigured' | 'configured' | 'generating' | 'furnished' | 'stale' | 'error'
export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'stale'
export type GenerationStage = 'selecting' | 'placing' | 'validating'

export interface SavedConfiguration {
  revision: number
  prompt: string
  budget: Budget | null
  requirements: Requirement[]
  roomInstructions: RoomInstruction[]
  /** Blocking errors (e.g. after a room was recategorized) and notices such as NO_CATALOG_MATCH. */
  findings: ApiErrorDetail[]
}

export interface Project {
  id: string
  name: string
  unitSystem: UnitSystem
  mode: ProjectMode
  revision: number
  layoutSource: 'demo'
  layoutNotice: string
  demoLayoutId: typeof DEMO_LAYOUT_ID
  floorPlanAsset: Asset | null
  /** Current rooms; objects are the active layout's placements. */
  floor: Floor
  roomTransforms: RoomTransform[]
  configuration: SavedConfiguration
  activeLayoutId: string | null
  /** Set when saved rooms/configuration no longer match the active layout. */
  stale: { since: string; reason: string } | null
  roomStatuses: Array<{ roomId: string; status: RoomStatus }>
  latestGeneration: { id: string; status: GenerationStatus; stage: GenerationStage | null; scope: GenerationScope } | null
  createdAt: string
  updatedAt: string
}

export interface GenerationIssue {
  code: string
  message: string
  roomId?: string
  requirementId?: string
  instanceIds?: string[]
  ruleId?: string
  suggestion?: string
}

export interface TurnSummary {
  turn: number
  tool: string
  pass?: boolean
  violations?: number
  score?: number
  note?: string
  details?: string[]
  latencyMs: number
}

export interface Generation {
  id: string
  projectId: string
  scope: GenerationScope
  status: GenerationStatus
  stage: GenerationStage | null
  progress: { turn: number; maxTurns: number; turns: TurnSummary[] }
  inputRevision: number
  inputConfigurationRevision: number
  catalogVersion: string
  layoutId: string | null
  errorCode: string | null
  issues: GenerationIssue[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export interface CreateGenerationResponse {
  generationId: string
  status: GenerationStatus
  statusUrl: string
}

export interface Violation {
  ruleId: string
  roomId: string | null
  itemIds: string[]
  message: string
  hint: string
}

export interface RoomMetrics {
  roomId: string
  walkableAreaPct: number
  minPathWidthM: number | null
  doorsConnected: boolean
}

export interface EngineReport {
  pass: boolean
  violations: Violation[]
  metrics: RoomMetrics[]
  score: number
  totalPriceMinor: number
  unpricedItemIds: string[]
}

export interface Layout {
  id: string
  projectId: string
  generationId: string
  activated: boolean
  inputRevision: number
  inputConfigurationRevision: number
  catalogVersion: string
  scope: GenerationScope
  scene: Floor
  placements: PlacedObject[]
  totalPriceMinor: number
  currency: 'USD'
  engineReport: EngineReport
  rationale: string
  planner: string
  createdAt: string
}

export interface CatalogItem {
  id: string
  name: string
  objectType: ObjectType
  roomTypes: RoomType[]
  /** `default`: a standard-size stand-in with no product, price or color. */
  source: 'inventory' | 'default'
  priceMinor: number | null
  currency: 'USD'
  footprint: Dimensions
  colorName: string | null
  colorHex: string | null
  colorFamilies: string[]
  materials: string[]
  styleTags: string[]
  featureTags: string[]
  category: string | null
  url: string | null
  imageUrl: string | null
}

export interface FurnitureType {
  id: ObjectType
  label: string
  roomTypes: RoomType[]
}

export interface FurnitureResponse {
  version: string
  currency: 'USD'
  types: FurnitureType[]
  items: CatalogItem[]
}

export interface SafetyRule {
  id: string
  title: string
  description: string
  params: Record<string, number>
  severity: 'hard'
  appliesTo: { roomTypes: RoomType[] }
  availability: 'supported'
}

export interface RulesResponse {
  version: string
  defaults: Record<string, number>
  items: SafetyRule[]
}
