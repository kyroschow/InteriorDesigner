/**
 * In-browser implementation of `/api/v1`, used when VITE_API_MODE is not
 * `live`. It is a fetch-compatible transport: same URLs, methods, JSON and
 * multipart bodies, status codes and error envelopes as the real backend
 * contract, returning real `Response` objects. Loaded lazily by the client
 * so live builds never execute it.
 */
import { CATALOG_VERSION, COLOR_FAMILIES, FURNITURE_TYPES, filterCatalog } from './catalog'
import { defaultConfiguration, interpretAll, noteGate, roomSignature, roomStatuses, validateConfiguration } from './configuration'
import { loadState, newId, nowIso, nowMs, saveState, type GenerationOutcome, type MockState, type StoredProject } from './db'
import { DEMO_ROOMS, DEMO_TRANSFORMS, FOOTPRINT_M, buildFloor, validateRoomGeometry } from './demoLayout'
import { TIMELINE_MS, runGeneration, settleGenerations, viewGeneration } from './generation'
import { BELIEF_SYSTEMS, RULE_VERSION, listRules } from './rules'
import { validateRequest, type RequestDefinition } from './schema'
import {
  ACCEPTED_UPLOAD_TYPES,
  DEMO_LAYOUT_ID,
  MAX_UPLOAD_BYTES,
  type ApiErrorDetail,
  type Asset,
  type CreateGenerationRequest,
  type CreateGenerationResponse,
  type CreateProjectRequest,
  type FurnitureResponse,
  type Generation,
  type Project,
  type ReplaceConfigurationRequest,
  type ReplaceRoomsRequest,
  type RulesResponse,
  type UpdateProjectRequest,
  type UpdateRoomNoteRequest,
} from '@/types/interior'

let latencyMs = 150

/** Simulated network latency; tests set 0. */
export function setMockLatency(ms: number): void {
  latencyMs = ms
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message)
  }
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('The request was aborted.', 'AbortError'))
    if (signal?.aborted) return abort()
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        abort()
      },
      { once: true },
    )
  })
}

interface Ctx {
  state: MockState
  params: string[]
  query: URLSearchParams
  headers: Headers
  body: unknown
  form: FormData | null
}

function validated<T>(definition: RequestDefinition, body: unknown): T {
  const errors = validateRequest(definition, body)
  if (errors.length) throw new HttpError(422, 'INVALID_REQUEST', 'The request body does not match the schema.', errors)
  return body as T
}

function projectOr404(ctx: Ctx): StoredProject {
  const project = ctx.state.projects[ctx.params[0]]
  if (!project) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'No project with that id.')
  return project
}

function checkRevision(project: StoredProject, expected: number): void {
  if (expected !== project.revision) {
    throw new HttpError(409, 'REVISION_CONFLICT', 'This project changed since you loaded it. Reload before retrying.', [
      { path: 'expectedRevision', code: 'STALE_REVISION', message: `Current revision is ${project.revision}.` },
    ])
  }
}

function touch(project: StoredProject): void {
  project.revision += 1
  project.updatedAt = nowIso()
}

function settle(ctx: Ctx, projectId: string): void {
  if (settleGenerations(ctx.state, projectId, nowMs(), nowIso())) saveState(ctx.state)
}

function toProject(state: MockState, p: StoredProject): Project {
  // Validity can change after a save (e.g. a room retyped under a requirement), so re-derive it on read.
  const { errors } = validateConfiguration(p.rooms, p.configuration)
  return {
    id: p.id,
    name: p.name,
    unitSystem: p.unitSystem,
    mode: p.mode,
    revision: p.revision,
    layoutSource: 'demo',
    demoLayoutId: DEMO_LAYOUT_ID,
    floorPlanAssetId: p.floorPlanAssetId,
    floorPlanAsset: p.floorPlanAssetId ? (state.assets[p.floorPlanAssetId] ?? null) : null,
    footprintM: FOOTPRINT_M,
    floor: buildFloor(p.rooms, p.roomTransforms),
    roomTransforms: p.roomTransforms,
    configuration: p.configuration,
    noteInterpretations: interpretAll(p),
    configurationFindings: [
      ...p.configurationFindings,
      ...errors.map((e) => ({ code: e.code, severity: 'error' as const, message: e.message ?? e.code, path: e.path, roomId: e.roomId, requirementId: e.requirementId, ruleId: e.ruleId })),
    ],
    activeLayoutId: p.activeLayoutId,
    latestGenerationId: p.latestGenerationId,
    roomStatuses: roomStatuses(state, p),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

// ------------------------------------------------------------------ handlers

function createProject(ctx: Ctx): Response {
  const body = validated<CreateProjectRequest>('CreateProjectRequest', ctx.body)
  const now = nowIso()
  const project: StoredProject = {
    id: newId('prj'),
    name: body.name,
    unitSystem: body.unitSystem,
    mode: body.mode,
    revision: 1,
    floorPlanAssetId: null,
    rooms: structuredClone(DEMO_ROOMS),
    roomTransforms: structuredClone(DEMO_TRANSFORMS),
    configuration: defaultConfiguration(DEMO_ROOMS),
    configurationFindings: [],
    activeLayoutId: null,
    latestGenerationId: null,
    createdAt: now,
    updatedAt: now,
  }
  ctx.state.projects[project.id] = project
  saveState(ctx.state)
  return json(201, toProject(ctx.state, project))
}

function getProject(ctx: Ctx): Response {
  const project = projectOr404(ctx)
  settle(ctx, project.id)
  return json(200, toProject(ctx.state, project))
}

function updateProject(ctx: Ctx): Response {
  const body = validated<UpdateProjectRequest>('UpdateProjectRequest', ctx.body)
  const project = projectOr404(ctx)
  checkRevision(project, body.expectedRevision)
  if (body.name !== undefined) project.name = body.name
  if (body.unitSystem !== undefined) project.unitSystem = body.unitSystem
  touch(project)
  saveState(ctx.state)
  return json(200, toProject(ctx.state, project))
}

const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  'application/pdf': (b) => String.fromCharCode(...b.slice(0, 4)) === '%PDF',
}

async function uploadFloorPlan(ctx: Ctx): Promise<Response> {
  const form = ctx.form
  if (!form) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the floor plan as multipart/form-data.')
  const files = form.getAll('file')
  const revisions = form.getAll('expectedRevision')
  if (files.length > 1) throw new HttpError(422, 'INVALID_REQUEST', 'Send exactly one file.', [{ path: 'file', code: 'MAX_ITEMS', message: 'Exactly one file.' }])
  // Multipart text parts are coerced to the schema's integer before validation.
  const candidate: Record<string, unknown> = {}
  if (files.length === 1) candidate.file = typeof files[0] === 'string' ? 0 : 'binary'
  if (revisions.length === 1) candidate.expectedRevision = typeof revisions[0] === 'string' && /^\d+$/.test(revisions[0]) ? Number(revisions[0]) : revisions[0]
  for (const key of new Set(form.keys())) if (key !== 'file' && key !== 'expectedRevision') candidate[key] = true
  const body = validated<{ expectedRevision: number }>('UploadFloorPlanRequest', candidate)

  const project = projectOr404(ctx)
  checkRevision(project, body.expectedRevision)
  const file = files[0] as File
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Floor plans are limited to 20 MB.')
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Upload a PNG, JPEG, WebP or PDF file.')
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!MAGIC[file.type](head)) throw new HttpError(415, 'CONTENT_MISMATCH', `The file's contents don't look like a ${file.type} file.`)

  // The mock keeps metadata only; the original bytes are not stored.
  const asset: Asset = { id: newId('ast'), name: file.name || 'floor-plan', mimeType: file.type, sizeBytes: file.size, downloadUrl: null, createdAt: nowIso() }
  ctx.state.assets[asset.id] = asset
  project.floorPlanAssetId = asset.id
  touch(project)
  saveState(ctx.state)
  return json(201, asset)
}

function replaceRooms(ctx: Ctx): Response {
  const body = validated<ReplaceRoomsRequest>('ReplaceRoomsRequest', ctx.body)
  const project = projectOr404(ctx)
  checkRevision(project, body.expectedRevision)
  const errors = validateRoomGeometry(
    project.rooms.map((r) => r.id),
    body.rooms,
    body.roomTransforms,
  )
  if (errors.length) throw new HttpError(422, 'INVALID_ROOMS', 'These room edits are not valid.', errors)
  const order = project.rooms.map((r) => r.id)
  project.rooms = order.map((id) => body.rooms.find((r) => r.id === id) as ReplaceRoomsRequest['rooms'][number])
  project.roomTransforms = order.map((id) => body.roomTransforms.find((t) => t.roomId === id) as ReplaceRoomsRequest['roomTransforms'][number])
  touch(project)
  saveState(ctx.state)
  return json(200, toProject(ctx.state, project))
}

function replaceConfiguration(ctx: Ctx): Response {
  const body = validated<ReplaceConfigurationRequest>('ReplaceConfigurationRequest', ctx.body)
  const project = projectOr404(ctx)
  checkRevision(project, body.expectedRevision)
  const { errors, findings } = validateConfiguration(project.rooms, body.configuration)
  if (errors.length) throw new HttpError(422, 'INVALID_CONFIGURATION', 'The configuration is not valid.', errors)
  const config = structuredClone(body.configuration)
  config.roomInstructions = project.rooms.map((r) => config.roomInstructions.find((i) => i.roomId === r.id) ?? { roomId: r.id, note: '' })
  project.configuration = { ...config, revision: project.configuration.revision + 1 }
  project.configurationFindings = findings
  touch(project)
  saveState(ctx.state)
  return json(200, toProject(ctx.state, project))
}

function updateRoomNote(ctx: Ctx): Response {
  const body = validated<UpdateRoomNoteRequest>('UpdateRoomNoteRequest', ctx.body)
  const project = projectOr404(ctx)
  const roomId = ctx.params[1]
  if (!project.rooms.some((r) => r.id === roomId)) throw new HttpError(404, 'ROOM_NOT_FOUND', 'No room with that id in this project.')
  checkRevision(project, body.expectedRevision)
  project.configuration = {
    ...project.configuration,
    roomInstructions: project.configuration.roomInstructions.map((i) => (i.roomId === roomId ? { roomId, note: body.note } : i)),
    revision: project.configuration.revision + 1,
  }
  touch(project)
  saveState(ctx.state)
  return json(200, toProject(ctx.state, project))
}

function createGeneration(ctx: Ctx): Response {
  const key = ctx.headers.get('Idempotency-Key')?.trim()
  if (!key) throw new HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header.')
  const body = validated<CreateGenerationRequest>('CreateGenerationRequest', ctx.body)
  const project = projectOr404(ctx)
  const payload = JSON.stringify({ expectedRevision: body.expectedRevision, configurationRevision: body.configurationRevision, scope: body.scope })
  const statusUrl = (id: string) => `/api/v1/projects/${project.id}/generations/${id}`

  const existing = ctx.state.idempotency[`${project.id}:${key}`]
  if (existing) {
    if (ctx.state.generations[existing]?.payload !== payload) {
      throw new HttpError(409, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used with a different request.')
    }
    return json(202, { generationId: existing, status: 'queued', statusUrl: statusUrl(existing) } satisfies CreateGenerationResponse)
  }

  settle(ctx, project.id)
  checkRevision(project, body.expectedRevision)
  if (body.configurationRevision !== project.configuration.revision) {
    throw new HttpError(409, 'CONFIGURATION_REVISION_CONFLICT', 'The configuration changed since you loaded it. Reload before applying.', [
      { path: 'configurationRevision', code: 'STALE_REVISION', message: `Current configuration revision is ${project.configuration.revision}.` },
    ])
  }
  const scopeRoomIds = body.scope.kind === 'home' ? project.rooms.map((r) => r.id) : [body.scope.roomId]
  if (body.scope.kind === 'room' && !project.rooms.some((r) => r.id === scopeRoomIds[0])) {
    throw new HttpError(422, 'INVALID_REQUEST', 'Unknown room in scope.', [{ path: 'scope.roomId', code: 'UNKNOWN_ROOM', roomId: scopeRoomIds[0] }])
  }
  const { errors } = validateConfiguration(project.rooms, project.configuration)
  if (errors.length) throw new HttpError(422, 'INVALID_CONFIGURATION', 'The saved configuration is no longer valid for the current rooms.', errors)
  const interpretations = interpretAll(project)
  const gate = noteGate(interpretations, scopeRoomIds)
  if (gate.unresolved.length) {
    throw new HttpError(422, 'ROOM_NOTE_UNRESOLVED', "Some room notes read as requirements the generator can't check yet. Clarify them before applying.", gate.unresolved)
  }
  if (gate.conflicts.length) throw new HttpError(422, 'ROOM_NOTE_CONFLICT', 'A room note contradicts the saved furniture settings.', gate.conflicts)

  const generationId = newId('gen')
  const createdAt = nowIso()
  const startedMs = nowMs()
  const previousLayout = project.activeLayoutId ? (ctx.state.layouts[project.activeLayoutId] ?? null) : null
  const previousSignatures = project.activeLayoutId ? (ctx.state.layoutMeta[project.activeLayoutId]?.roomSignatures ?? {}) : {}
  const roomSignatures =
    body.scope.kind === 'home'
      ? Object.fromEntries(project.rooms.map((r) => [r.id, roomSignature(project, r.id)]))
      : { ...previousSignatures, [body.scope.roomId]: roomSignature(project, body.scope.roomId) }
  const inputRevisions = { project: project.revision, configuration: project.configuration.revision }

  let outcome: GenerationOutcome
  try {
    outcome = runGeneration({
      generationId,
      layoutId: newId('lay'),
      projectId: project.id,
      scope: body.scope,
      inputRevisions,
      configuration: structuredClone(project.configuration),
      floor: buildFloor(project.rooms, project.roomTransforms),
      roomTransforms: structuredClone(project.roomTransforms),
      footprintM: FOOTPRINT_M,
      interpretations,
      previousLayout,
      roomSignatures,
      createdAt,
    })
  } catch (err) {
    console.error('[mock api] generation crashed', err)
    outcome = {
      status: 'failed',
      layout: null,
      error: { code: 'ENGINE_ERROR', message: 'The generator hit an unexpected error.' },
      issues: [{ code: 'ENGINE_ERROR', severity: 'error', message: err instanceof Error ? err.message : String(err) }],
      roomSignatures: {},
    }
  }

  const record: Generation = {
    id: generationId,
    projectId: project.id,
    scope: body.scope,
    inputRevisions,
    catalogVersion: CATALOG_VERSION,
    ruleVersion: RULE_VERSION,
    status: 'queued',
    stage: null,
    layoutId: null,
    error: null,
    issues: [],
    createdAt,
    updatedAt: createdAt,
  }
  ctx.state.generations[generationId] = { record, idempotencyKey: key, payload, startedMs, finishMs: startedMs + TIMELINE_MS.finish, resolved: false, outcome }
  ctx.state.idempotency[`${project.id}:${key}`] = generationId
  project.latestGenerationId = generationId
  saveState(ctx.state)
  return json(202, { generationId, status: 'queued', statusUrl: statusUrl(generationId) } satisfies CreateGenerationResponse)
}

function getGeneration(ctx: Ctx): Response {
  const project = projectOr404(ctx)
  settle(ctx, project.id)
  const job = ctx.state.generations[ctx.params[1]]
  if (!job || job.record.projectId !== project.id) throw new HttpError(404, 'GENERATION_NOT_FOUND', 'No generation with that id in this project.')
  return json(200, viewGeneration(job, nowMs()))
}

function getLayout(ctx: Ctx): Response {
  const project = projectOr404(ctx)
  settle(ctx, project.id)
  const layout = ctx.state.layouts[ctx.params[1]]
  if (!layout || layout.projectId !== project.id) throw new HttpError(404, 'LAYOUT_NOT_FOUND', 'No layout with that id in this project.')
  return json(200, layout)
}

function getFurniture(ctx: Ctx): Response {
  const number = (key: string) => {
    const raw = ctx.query.get(key)
    if (raw === null || raw === '') return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) throw new HttpError(422, 'INVALID_QUERY', `${key} must be a non-negative number.`, [{ path: key, code: 'TYPE' }])
    return n
  }
  const roomType = ctx.query.get('roomType')
  const body: FurnitureResponse = {
    version: CATALOG_VERSION,
    currency: 'USD',
    items: filterCatalog({
      roomType,
      objectType: ctx.query.get('objectType'),
      color: ctx.query.get('color'),
      maxPriceMinor: number('maxPriceMinor'),
      maxWidthM: number('maxWidthM'),
      maxDepthM: number('maxDepthM'),
      maxHeightM: number('maxHeightM'),
    }),
    types: roomType ? FURNITURE_TYPES.filter((t) => t.allowedRoomTypes.includes(roomType as never)) : FURNITURE_TYPES,
    colorFamilies: COLOR_FAMILIES,
  }
  return json(200, body)
}

function getRules(ctx: Ctx): Response {
  const body: RulesResponse = { version: RULE_VERSION, items: listRules(ctx.query.get('roomType')), beliefSystems: BELIEF_SYSTEMS }
  return json(200, body)
}

type Handler = (ctx: Ctx) => Response | Promise<Response>

const ROUTES: Array<{ method: string; pattern: RegExp; body?: 'json' | 'multipart'; handler: Handler }> = [
  { method: 'POST', pattern: /^\/projects$/, body: 'json', handler: createProject },
  { method: 'GET', pattern: /^\/projects\/([^/]+)$/, handler: getProject },
  { method: 'PATCH', pattern: /^\/projects\/([^/]+)$/, body: 'json', handler: updateProject },
  { method: 'POST', pattern: /^\/projects\/([^/]+)\/floor-plan$/, body: 'multipart', handler: uploadFloorPlan },
  { method: 'PUT', pattern: /^\/projects\/([^/]+)\/rooms$/, body: 'json', handler: replaceRooms },
  { method: 'PUT', pattern: /^\/projects\/([^/]+)\/configuration$/, body: 'json', handler: replaceConfiguration },
  { method: 'PATCH', pattern: /^\/projects\/([^/]+)\/rooms\/([^/]+)\/note$/, body: 'json', handler: updateRoomNote },
  { method: 'POST', pattern: /^\/projects\/([^/]+)\/generations$/, body: 'json', handler: createGeneration },
  { method: 'GET', pattern: /^\/projects\/([^/]+)\/generations\/([^/]+)$/, handler: getGeneration },
  { method: 'GET', pattern: /^\/projects\/([^/]+)\/layouts\/([^/]+)$/, handler: getLayout },
  { method: 'GET', pattern: /^\/furniture$/, handler: getFurniture },
  { method: 'GET', pattern: /^\/rules$/, handler: getRules },
]

export async function mockFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(href, 'http://mock.local')
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  try {
    await delay(latencyMs, init.signal)
    const match = url.pathname.match(/\/api\/v1(\/.*)$/)
    if (!match) throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint.')
    const path = match[1].replace(/\/+$/, '')
    const matches = ROUTES.map((route) => ({ route, m: path.match(route.pattern) })).filter((x) => x.m !== null)
    if (!matches.length) throw new HttpError(404, 'NOT_FOUND', 'Unknown endpoint.')
    const hit = matches.find((x) => x.route.method === method)
    if (!hit) throw new HttpError(405, 'METHOD_NOT_ALLOWED', `${method} is not supported for this endpoint.`)

    let body: unknown
    let form: FormData | null = null
    if (hit.route.body === 'json') {
      if (!(headers.get('Content-Type') ?? '').includes('application/json')) {
        throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON with Content-Type: application/json.')
      }
      try {
        body = JSON.parse(typeof init.body === 'string' ? init.body : '')
      } catch {
        throw new HttpError(400, 'INVALID_JSON', 'The request body is not valid JSON.')
      }
    } else if (hit.route.body === 'multipart') {
      form = init.body instanceof FormData ? init.body : null
    }

    const params = (hit.m as RegExpMatchArray).slice(1).map(decodeURIComponent)
    return await hit.route.handler({ state: loadState(), params, query: url.searchParams, headers, body, form })
  } catch (err) {
    if (err instanceof HttpError) {
      return json(err.status, { error: { code: err.code, message: err.message, ...(err.details.length ? { details: err.details } : {}) } })
    }
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    console.error('[mock api]', err)
    return json(500, { error: { code: 'INTERNAL_ERROR', message: 'The mock server hit an unexpected error.' } })
  }
}
