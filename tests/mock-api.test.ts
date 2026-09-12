/**
 * Contract tests for the in-browser mock of /api/v1, following the
 * verification lists in docs/design. Run with `npm run test:api`.
 */
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { resetMockState, setMockClock } from '../src/api/mock/db'
import { mockFetch, setMockLatency } from '../src/api/mock/server'
import type { Configuration, FurnitureResponse, Generation, Layout, Project, RulesResponse } from '../src/types/interior'

let now = 1_700_000_000_000
setMockClock(() => now)
setMockLatency(0)

beforeEach(() => resetMockState())

async function call<T = unknown>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const init: RequestInit = { method, headers: { ...headers } }
  if (body instanceof FormData) init.body = body
  else if (body !== undefined) {
    init.body = JSON.stringify(body)
    ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  const res = await mockFetch(`/api/v1${path}`, init)
  return { status: res.status, data: (await res.json()) as T & { error?: { code: string; details?: Array<{ code: string; path?: string }> } } }
}

async function createProject(): Promise<Project> {
  const res = await call<Project>('POST', '/projects', { name: 'My apartment', unitSystem: 'metric', mode: 'upload', demoLayoutId: 'four-room-v1' })
  assert.equal(res.status, 201)
  return res.data
}

const configWith = (project: Project, patch: Partial<Configuration>): Configuration => {
  const { revision: _revision, ...config } = project.configuration
  return { ...config, ...patch }
}

async function saveConfig(project: Project, patch: Partial<Configuration>) {
  return call<Project>('PUT', `/projects/${project.id}/configuration`, { expectedRevision: project.revision, configuration: configWith(project, patch) })
}

async function generate(project: Project, scope: { kind: 'home' } | { kind: 'room'; roomId: string } = { kind: 'home' }, key = crypto.randomUUID()) {
  return call<{ generationId: string; status: string; statusUrl: string }>(
    'POST',
    `/projects/${project.id}/generations`,
    { expectedRevision: project.revision, configurationRevision: project.configuration.revision, scope },
    { 'Idempotency-Key': key },
  )
}

async function finish(projectId: string, generationId: string) {
  now += 5000
  const res = await call<Generation>('GET', `/projects/${projectId}/generations/${generationId}`)
  assert.equal(res.status, 200)
  return res.data
}

const BEDROOM_SETUP: Partial<Configuration> = {
  requirements: [
    { id: 'req-bed', objectType: 'sleep.bed.queen', quantity: 1, roomId: 'room-3', allowedColors: [], maxDimensionsM: { w: 1.8, d: 2.2, h: 1.3 } },
    { id: 'req-ns', objectType: 'tables.nightstand', quantity: 2, roomId: 'room-3', allowedColors: [] },
    { id: 'req-sofa', objectType: 'seating.sofa', quantity: 1, roomId: 'room-1', allowedColors: [] },
    { id: 'req-tv', objectType: 'storage.tv_stand', quantity: 1, roomId: null, allowedColors: [] },
  ],
}

test('creates a demo-backed project with the four-room shell', async () => {
  const project = await createProject()
  assert.equal(project.revision, 1)
  assert.equal(project.layoutSource, 'demo')
  assert.deepEqual(
    project.floor.rooms.map((r) => [r.id, r.type, r.area_m2]),
    [
      ['room-1', 'living_room', 24],
      ['room-2', 'kitchen', 16],
      ['room-3', 'bedroom_primary', 24],
      ['room-4', 'bathroom_full', 16],
    ],
  )
  assert.ok(project.floor.rooms.every((r) => r.ceiling_height_m === 2.7))
  assert.equal(project.configuration.roomInstructions.length, 4)
  const refreshed = await call<Project>('GET', `/projects/${project.id}`)
  assert.equal(refreshed.data.id, project.id)
})

test('rejects unknown properties and stale revisions', async () => {
  const bad = await call('POST', '/projects', { name: 'x', unitSystem: 'metric', mode: 'scratch', demoLayoutId: 'four-room-v1', extra: 1 })
  assert.equal(bad.status, 422)
  assert.equal(bad.data.error?.details?.[0].code, 'UNKNOWN_PROPERTY')

  const project = await createProject()
  const ok = await call<Project>('PATCH', `/projects/${project.id}`, { expectedRevision: 1, name: 'Home' })
  assert.equal(ok.data.revision, 2)
  const stale = await call('PATCH', `/projects/${project.id}`, { expectedRevision: 1, unitSystem: 'imperial' })
  assert.equal(stale.status, 409)
  assert.equal((await call('GET', '/projects/nope')).status, 404)
})

test('upload validates type, content and size, and bumps the revision', async () => {
  const project = await createProject()
  const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'plan.png', { type: 'image/png' })
  const form = new FormData()
  form.set('expectedRevision', '1')
  form.set('file', png)
  const ok = await call<{ id: string; sizeBytes: number }>('POST', `/projects/${project.id}/floor-plan`, form)
  assert.equal(ok.status, 201)
  assert.equal((await call<Project>('GET', `/projects/${project.id}`)).data.floorPlanAsset?.id, ok.data.id)

  const fake = new FormData()
  fake.set('expectedRevision', '2')
  fake.set('file', new File(['not a pdf'], 'plan.pdf', { type: 'application/pdf' }))
  assert.equal((await call('POST', `/projects/${project.id}/floor-plan`, fake)).status, 415)

  const huge = new FormData()
  huge.set('expectedRevision', '2')
  huge.set('file', new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }))
  assert.equal((await call('POST', `/projects/${project.id}/floor-plan`, huge)).status, 413)
})

test('room edits must tile the shell and keep fixed elements valid', async () => {
  const project = await createProject()
  const rect = (w: number, d: number) => [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: d },
    { x: 0, y: d },
  ]
  const rooms = (livingW: number) => [
    { id: 'room-1', label: 'Lounge', type: 'living_room', polygon: rect(livingW, 4) },
    { id: 'room-2', label: 'Kitchen', type: 'kitchen', polygon: rect(10 - livingW, 4) },
    { id: 'room-3', label: 'Bedroom', type: 'bedroom_primary', polygon: rect(6, 4) },
    { id: 'room-4', label: 'Bathroom', type: 'bathroom_full', polygon: rect(4, 4) },
  ]
  const transforms = (livingW: number) => [
    { roomId: 'room-1', origin: { x: 0, y: 0 } },
    { roomId: 'room-2', origin: { x: livingW, y: 0 } },
    { roomId: 'room-3', origin: { x: 0, y: 4 } },
    { roomId: 'room-4', origin: { x: 6, y: 4 } },
  ]
  const ok = await call<Project>('PUT', `/projects/${project.id}/rooms`, { expectedRevision: 1, rooms: rooms(5.5), roomTransforms: transforms(5.5) })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.floor.rooms[0].label, 'Lounge')
  assert.equal(ok.data.floor.rooms[1].area_m2, 18)

  const counterOut = await call('PUT', `/projects/${project.id}/rooms`, { expectedRevision: 2, rooms: rooms(8), roomTransforms: transforms(8) })
  assert.equal(counterOut.status, 422)
  assert.ok(counterOut.data.error?.details?.some((d) => d.code === 'FIXED_ELEMENT_INVALID'))

  const overlap = transforms(6)
  overlap[1].origin.x = 5
  const overlapping = await call('PUT', `/projects/${project.id}/rooms`, { expectedRevision: 2, rooms: rooms(6), roomTransforms: overlap })
  assert.equal(overlapping.status, 422)
})

test('configuration semantics: room type mismatch, overlap and unavailable types', async () => {
  const project = await createProject()
  const bedInKitchen = await saveConfig(project, { requirements: [{ id: 'req-bed', objectType: 'sleep.bed.queen', quantity: 1, roomId: 'room-2', allowedColors: [] }] })
  assert.equal(bedInKitchen.status, 422)
  assert.equal(bedInKitchen.data.error?.details?.[0].code, 'ROOM_TYPE_MISMATCH')

  const doubled = await saveConfig(project, {
    requirements: [
      { id: 'a', objectType: 'seating.sofa', quantity: 1, roomId: null, allowedColors: [] },
      { id: 'b', objectType: 'seating.sofa.loveseat', quantity: 1, roomId: 'room-1', allowedColors: [] },
    ],
  })
  assert.equal(doubled.data.error?.details?.[0].code, 'OVERLAPPING_REQUIREMENT')

  const bundle = await saveConfig(project, { requirements: [{ id: 'd', objectType: 'tables.dining_set', quantity: 1, roomId: 'room-2', allowedColors: [] }] })
  assert.equal(bundle.data.error?.details?.[0].code, 'OBJECT_TYPE_UNAVAILABLE')

  const missingNote = await call('PUT', `/projects/${project.id}/configuration`, {
    expectedRevision: 1,
    configuration: { ...configWith(project, {}), roomInstructions: project.configuration.roomInstructions.slice(0, 3) },
  })
  assert.equal(missingNote.status, 422)

  const ok = await saveConfig(project, BEDROOM_SETUP)
  assert.equal(ok.status, 200)
  assert.equal(ok.data.configuration.revision, 2)
})

test('notes persist, are interpreted, and gate Apply', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const note = await call<Project>('PATCH', `/projects/${project.id}/rooms/room-3/note`, { expectedRevision: project.revision, note: 'Keep at least 0.8 m clear in front of the bed. Prefer light wood.' })
  assert.equal(note.status, 200)
  project = note.data
  assert.equal(project.configuration.revision, 3)
  const clauses = project.noteInterpretations.find((i) => i.roomId === 'room-3')?.clauses ?? []
  assert.deepEqual(
    clauses.map((c) => [c.kind, c.status, c.valueM ?? null]),
    [
      ['minimum_clearance', 'supported', 0.8],
      ['style_preference', 'supported', null],
    ],
  )

  project = (await call<Project>('PATCH', `/projects/${project.id}/rooms/room-1/note`, { expectedRevision: project.revision, note: 'Keep the sofa clear.' })).data
  const unresolved = await generate(project)
  assert.equal(unresolved.status, 422)
  assert.equal(unresolved.data.error?.code, 'ROOM_NOTE_UNRESOLVED')

  project = (await call<Project>('PATCH', `/projects/${project.id}/rooms/room-1/note`, { expectedRevision: project.revision, note: 'No TV.' })).data
  const sofaOnly = { ...BEDROOM_SETUP, requirements: BEDROOM_SETUP.requirements?.map((r) => (r.id === 'req-tv' ? { ...r, roomId: 'room-1' } : r)) }
  project = (await saveConfig(project, sofaOnly)).data
  const conflict = await generate(project)
  assert.equal(conflict.data.error?.code, 'ROOM_NOTE_CONFLICT')
  // Geometry saves don't drop notes.
  assert.equal(project.configuration.roomInstructions.find((i) => i.roomId === 'room-3')?.note.startsWith('Keep at least'), true)
})

test('home generation places exact quantities in eligible rooms within budget', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const job = await generate(project)
  assert.equal(job.status, 202)
  const queued = await call<Generation>('GET', `/projects/${project.id}/generations/${job.data.generationId}`)
  assert.equal(queued.data.status, 'queued')

  const done = await finish(project.id, job.data.generationId)
  assert.equal(done.status, 'succeeded', JSON.stringify(done.issues))
  const layout = (await call<Layout>('GET', `/projects/${project.id}/layouts/${done.layoutId}`)).data
  const count = (req: string) => layout.requirementAssignments.filter((a) => a.requirementId === req).length
  assert.equal(count('req-bed'), 1)
  assert.equal(count('req-ns'), 2)
  assert.equal(count('req-sofa'), 1)
  assert.equal(count('req-tv'), 1)
  const bedRoom = layout.requirementAssignments.find((a) => a.requirementId === 'req-bed')?.roomId
  assert.equal(bedRoom, 'room-3')
  assert.ok(layout.totalPriceMinor <= project.configuration.budget.amountMinor)
  assert.ok(!layout.floor.rooms.find((r) => r.id === 'room-2')?.objects.some((o) => o.type.startsWith('sleep.bed')))
  assert.equal(layout.lines.reduce((s, l) => s + l.priceMinor * l.quantity, 0), layout.totalPriceMinor)

  const refreshed = (await call<Project>('GET', `/projects/${project.id}`)).data
  assert.equal(refreshed.activeLayoutId, layout.id)
  assert.equal(refreshed.roomStatuses.find((s) => s.roomId === 'room-3')?.status, 'furnished')

  const edited = (await call<Project>('PATCH', `/projects/${project.id}/rooms/room-3/note`, { expectedRevision: refreshed.revision, note: 'Prefer white.' })).data
  assert.equal(edited.roomStatuses.find((s) => s.roomId === 'room-3')?.status, 'stale')
})

test('idempotency keys replay the original job and reject reuse with a different payload', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const first = await generate(project, { kind: 'home' }, 'key-1')
  const replay = await generate(project, { kind: 'home' }, 'key-1')
  assert.equal(replay.data.generationId, first.data.generationId)
  const reused = await generate(project, { kind: 'room', roomId: 'room-3' }, 'key-1')
  assert.equal(reused.status, 409)
  assert.equal((await call('POST', `/projects/${project.id}/generations`, { expectedRevision: 1, configurationRevision: 1, scope: { kind: 'home' } })).status, 400)
})

test('budget failures explain costs and preserve the previous layout', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const good = await finish(project.id, (await generate(project)).data.generationId)
  project = (await saveConfig((await call<Project>('GET', `/projects/${project.id}`)).data, { ...BEDROOM_SETUP, budget: { amountMinor: 5000, currency: 'USD' } })).data
  const failed = await finish(project.id, (await generate(project)).data.generationId)
  assert.equal(failed.status, 'failed')
  assert.equal(failed.error?.code, 'BUDGET_EXCEEDED')
  assert.ok(failed.issues.some((i) => i.requirementId === 'req-bed'))
  assert.equal((await call<Project>('GET', `/projects/${project.id}`)).data.activeLayoutId, good.layoutId)
})

test('a result whose inputs changed mid-run is stale and never activated', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const job = await generate(project)
  await call('PATCH', `/projects/${project.id}`, { expectedRevision: project.revision, name: 'Renamed' })
  const done = await finish(project.id, job.data.generationId)
  assert.equal(done.status, 'stale')
  assert.equal((await call<Project>('GET', `/projects/${project.id}`)).data.activeLayoutId, null)
})

test('room-only generation retains other rooms', async () => {
  let project = await createProject()
  project = (await saveConfig(project, BEDROOM_SETUP)).data
  const home = await finish(project.id, (await generate(project)).data.generationId)
  const before = (await call<Layout>('GET', `/projects/${project.id}/layouts/${home.layoutId}`)).data
  project = (await call<Project>('GET', `/projects/${project.id}`)).data
  const room = await finish(project.id, (await generate(project, { kind: 'room', roomId: 'room-3' })).data.generationId)
  assert.equal(room.status, 'succeeded', JSON.stringify(room.issues))
  const after = (await call<Layout>('GET', `/projects/${project.id}/layouts/${room.layoutId}`)).data
  const living = (l: Layout) => l.floor.rooms.find((r) => r.id === 'room-1')?.objects.map((o) => [o.variant_id, o.pose])
  assert.deepEqual(living(after), living(before))
  assert.equal(after.totalPriceMinor, before.totalPriceMinor)
})

test('catalog keeps unknown dimensions null, bed sizes distinct, and unsupported types browsable', async () => {
  const { data } = await call<FurnitureResponse>('GET', '/furniture')
  assert.equal(data.items.length, 80)
  assert.ok(data.items.every((i) => i.footprint.w !== 0 && i.footprint.d !== 0 && i.footprint.h !== 0))
  assert.ok(data.items.filter((i) => i.footprint.w === null).every((i) => i.selectionStatus !== 'eligible'))
  const slattum = data.items.find((i) => i.catalogItemId === 'ikea-70571256')
  assert.equal(slattum?.objectType, 'sleep.bed.queen')
  assert.deepEqual(slattum?.colorFamilies, ['gray'])
  assert.ok(data.items.some((i) => i.objectType === 'sleep.bed.full'))
  assert.ok(data.items.filter((i) => i.objectType === 'tables.dining_set').every((i) => i.selectionStatus === 'unsupported'))
  const filtered = await call<FurnitureResponse>('GET', '/furniture?roomType=bedroom_primary&maxWidthM=1')
  assert.ok(filtered.data.items.every((i) => i.footprint.w !== null && i.footprint.w <= 1))
})

test('rules come from the library with honest availability', async () => {
  const { data } = await call<RulesResponse>('GET', '/rules')
  assert.ok(data.items.length > 100)
  assert.equal(data.items.find((r) => r.id === 'FS-CMD-026')?.availability, 'supported')
  assert.equal(data.items.find((r) => r.id === 'RM-BEDP-001')?.availability, 'missing_inputs')
  assert.equal(data.items.find((r) => r.id === 'RM-BEDP-002')?.availability, 'unsupported')
  const project = await createProject()
  const unsupported = await saveConfig(project, { selectedRuleIds: ['RM-KIT-001'] })
  assert.equal(unsupported.data.error?.details?.[0].code, 'RULE_UNAVAILABLE')
  const ok = await saveConfig(project, { selectedRuleIds: ['FS-CMD-026'] })
  assert.equal(ok.status, 200)
})
