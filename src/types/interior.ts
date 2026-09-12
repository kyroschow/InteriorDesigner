/**
 * API contracts for `/api/v1`.
 *
 * Request types mirror docs/design/schemas/request-bodies.schema.json exactly
 * (objects there reject unknown properties, so never add fields to them).
 * Response types follow docs/design/interior-workspace-draft.md; the scene
 * records are the subset of the rule library's canonical Floor/Room/Object
 * (interior-rule-library/00-foundation/SPEC-CONTRACT.md) the MVP uses.
 *
 * Geometry is meters, 3 decimals, room-local, Y up. `rot` is degrees clockwise
 * from the canonical front (+Y). Pose origin is the footprint center.
 */

export type UnitSystem = 'metric' | 'imperial'
export type ProjectMode = 'upload' | 'scratch'
export type RoomType = 'living_room' | 'bedroom_primary' | 'kitchen' | 'bathroom_full'

export const ROOM_TYPES: RoomType[] = ['living_room', 'bedroom_primary', 'kitchen', 'bathroom_full']
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living_room: 'Living room',
  bedroom_primary: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom_full: 'Bathroom',
}

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
  objectType: string
  quantity: number
  /** null lets generation choose a suitable room; it never changes the quantity. */
  roomId: string | null
  /** Catalog color-family ids. Empty means any color. */
  allowedColors: string[]
  maxDimensionsM?: Dimensions
}

export interface RoomInstruction {
  roomId: string
  note: string
}

export interface Configuration {
  prompt: string
  budget: Budget
  requirements: Requirement[]
  selectedRuleIds: string[]
  enabledBeliefSystems: string[]
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

export interface Pose {
  x: number
  y: number
  z: number
  rot: number
}

export interface Wall {
  id: string
  a: Point
  b: Point
  thickness_m: number
  is_exterior: boolean
  /** Compass bearings are never inferred from drawing orientation. */
  bearing_deg: null
}

export interface Opening {
  id: string
  kind: 'door' | 'doorway' | 'window'
  wall_id: string
  /** Distance along the wall from `a` to the near edge of the opening. */
  offset_m: number
  width_m: number
  height_m: number
  sill_m: number
  swing: 'in_left' | 'in_right' | 'out_left' | 'out_right' | 'none'
  leads_to_room_id: string | null
  is_egress: boolean
  provenance: 'demo'
}

export interface SceneObject {
  id: string
  type: string
  label: string
  variant_id: string | null
  pose: Pose
  footprint: Dimensions
  materials: string[]
  colors: Array<{ hex: string; coverage_pct: number }>
  anchored: boolean
  is_fixed: boolean
  provenance: 'demo' | 'catalog'
}

export interface Room {
  id: string
  label: string
  type: RoomType
  polygon: Point[]
  ceiling_height_m: number
  ceiling_type: 'flat'
  area_m2: number
  walls: Wall[]
  openings: Opening[]
  features: []
  objects: SceneObject[]
}

export interface Floor {
  id: string
  level: number
  height_m: number
  rooms: Room[]
  stairs: []
}

// --------------------------------------------------------------- responses

export interface Asset {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  /** null when the backend kept metadata only (the mock never stores bytes). */
  downloadUrl: string | null
  createdAt: string
}

export type ClauseStatus = 'supported' | 'ambiguous' | 'unsupported' | 'conflict'

export interface NoteClause {
  roomId: string
  sourceText: string
  span: { start: number; end: number }
  kind: 'object_type_prohibition' | 'minimum_clearance' | 'allowed_color_families' | 'style_preference' | 'unrecognized'
  targetObjectType?: string
  side?: 'front' | 'back' | 'left' | 'right'
  valueM?: number
  colorFamilies?: string[]
  preferenceTerms?: string[]
  strength: 'hard' | 'soft'
  status: ClauseStatus
  message: string
}

export interface NoteInterpretation {
  roomId: string
  parserVersion: string
  clauses: NoteClause[]
}

export interface Finding {
  code: string
  severity: 'error' | 'warning' | 'info'
  message: string
  path?: string
  roomId?: string
  requirementId?: string
  ruleId?: string
  suggestion?: string
}

export type RoomStatus = 'unconfigured' | 'configured' | 'generating' | 'furnished' | 'stale' | 'error'

export interface SavedConfiguration extends Configuration {
  revision: number
}

export interface Project {
  id: string
  name: string
  unitSystem: UnitSystem
  mode: ProjectMode
  revision: number
  layoutSource: 'demo'
  demoLayoutId: typeof DEMO_LAYOUT_ID
  floorPlanAssetId: string | null
  floorPlanAsset: Asset | null
  /** Fixed outer shell the room partitions must tile. */
  footprintM: { w: number; d: number }
  floor: Floor
  roomTransforms: RoomTransform[]
  configuration: SavedConfiguration
  noteInterpretations: NoteInterpretation[]
  configurationFindings: Finding[]
  activeLayoutId: string | null
  latestGenerationId: string | null
  roomStatuses: Array<{ roomId: string; status: RoomStatus }>
  createdAt: string
  updatedAt: string
}

export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'stale'
export type GenerationStage = 'selecting' | 'placing' | 'validating'
export type GenerationErrorCode = 'NO_CATALOG_MATCH' | 'BUDGET_EXCEEDED' | 'NO_VALID_LAYOUT_FOUND' | 'ENGINE_ERROR'

export interface Generation {
  id: string
  projectId: string
  scope: GenerationScope
  inputRevisions: { project: number; configuration: number }
  catalogVersion: string
  ruleVersion: string
  status: GenerationStatus
  stage: GenerationStage | null
  layoutId: string | null
  error: { code: GenerationErrorCode; message: string } | null
  issues: Finding[]
  createdAt: string
  updatedAt: string
}

export interface CreateGenerationResponse {
  generationId: string
  status: 'queued'
  statusUrl: string
}

export interface RequirementAssignment {
  requirementId: string
  instanceId: string
  catalogItemId: string
  roomId: string
  objectId: string
}

export interface LayoutLine {
  catalogItemId: string
  name: string
  objectType: string
  colorName: string | null
  priceMinor: number
  quantity: number
  roomId: string
  url: string
  imageUrl: string | null
}

export interface Layout {
  id: string
  projectId: string
  generationId: string
  scope: GenerationScope
  inputRevisions: { project: number; configuration: number }
  catalogVersion: string
  ruleVersion: string
  footprintM: { w: number; d: number }
  floor: Floor
  roomTransforms: RoomTransform[]
  requirementAssignments: RequirementAssignment[]
  lines: LayoutLine[]
  totalPriceMinor: number
  currency: 'USD'
  findings: Finding[]
  explanations: Array<{ roomId?: string; requirementId?: string; message: string }>
  createdAt: string
}

export type SelectionStatus = 'eligible' | 'needs_review' | 'unsupported'

export interface CatalogItem {
  catalogItemId: string
  name: string
  objectType: string
  allowedRoomTypes: RoomType[]
  priceMinor: number | null
  currency: 'USD'
  /** Meters; null when the source record has no verified value. */
  footprint: { w: number | null; d: number | null; h: number | null }
  colorFamilies: string[]
  colorName: string | null
  colorHex: string | null
  materials: string[]
  styleTags: string[]
  featureTags: string[]
  installationMode: 'freestanding' | 'installed' | 'bundle'
  components: Array<{ objectType: string; count: number }>
  selectionStatus: SelectionStatus
  reviewReasons: string[]
  source: { file: string; url: string; imageUrls: string[] }
  catalogVersion: string
}

/** Requirement picker entry. Proposed response extension: not in the draft's `{version, currency, items}`. */
export interface FurnitureType {
  objectType: string
  label: string
  parent: string | null
  allowedRoomTypes: RoomType[]
  eligibleCount: number
  /** Selectable in requirements only when at least one eligible variant exists. */
  available: boolean
  reason: string | null
}

export interface FurnitureResponse {
  version: string
  currency: 'USD'
  items: CatalogItem[]
  types: FurnitureType[]
  colorFamilies: Array<{ id: string; label: string; hex: string }>
}

export interface Rule {
  id: string
  title: string
  system: string
  group: string | null
  version: number
  status: string
  scope: string | null
  severity: 'blocking' | 'high' | 'medium' | 'low' | 'advisory'
  confidence: string | null
  beliefGated: boolean
  /** Belief-system id this rule is gated on, e.g. `feng_shui`; null when not belief-gated. */
  beliefSystem: string | null
  appliesTo: { rooms: string[]; objects: string[] }
  requiresRules: string[]
  conflictsWith: string[]
  params: Array<{ key: string; default: number | string | null; unit: string | null }>
  source: { path: string; heading: string }
  availability: 'supported' | 'unsupported' | 'missing_inputs'
  reason: string | null
  requiredInputs: string[]
}

export interface RulesResponse {
  version: string
  items: Rule[]
  beliefSystems: Array<{ id: string; label: string }>
}

export interface ApiErrorDetail {
  path?: string
  code: string
  message?: string
  roomId?: string
  requirementId?: string
  ruleId?: string
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: ApiErrorDetail[] }
}
