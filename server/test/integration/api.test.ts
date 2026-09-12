import { afterEach, describe, expect, it } from 'vitest'
import { FakeLlmClient } from '../../src/llm/fakeLlmClient.ts'
import type { ChatRequest } from '../../src/llm/types.ts'
import { evaluate } from '../../src/rules/engine.ts'
import { catalog, createTestApp, demoRooms, multipart } from '../helpers.ts'

type TestApp = Awaited<ReturnType<typeof createTestApp>>
let t: TestApp | null = null
afterEach(async () => {
  await t?.close()
  t = null
})

interface Context {
  requirements: { requirementId: string; instanceIds: string[]; candidateItemIds: Record<string, string[]> }[]
  items: Record<string, { widthM: number; depthM: number }>
}
const contextOf = (req: ChatRequest) => JSON.parse(req.messages[1].content as string) as Context

/** Bed against the bedroom's left wall, toilet against the bathroom's right wall (whichever are in scope). */
function goodPlacements(ctx: Context) {
  const placements = []
  const bed = ctx.requirements.find((r) => r.requirementId === 'req-bed')
  if (bed) {
    const narrowestBed = [...bed.candidateItemIds['room-3']].sort((a, b) => ctx.items[a].depthM - ctx.items[b].depthM)[0]
    placements.push({ instanceId: bed.instanceIds[0], roomId: 'room-3', itemId: narrowestBed, anchor: { type: 'wall', wallId: 'wall-left', alongM: 1.0 } })
  }
  const toilet = ctx.requirements.find((r) => r.requirementId === 'req-toilet')
  if (toilet) {
    placements.push({ instanceId: toilet.instanceIds[0], roomId: 'room-4', itemId: toilet.candidateItemIds['room-4'][0], anchor: { type: 'wall', wallId: 'wall-right', alongM: 2.0 } })
  }
  return placements
}

async function configuredProject(app: TestApp['app']) {
  const created = await app.inject({ method: 'POST', url: '/api/v1/projects', payload: { name: 'Test', unitSystem: 'metric', mode: 'scratch', demoLayoutId: 'four-room-v1' } })
  expect(created.statusCode).toBe(201)
  const project = created.json()
  const configured = await app.inject({
    method: 'PUT',
    url: `/api/v1/projects/${project.id}/configuration`,
    payload: {
      expectedRevision: 1,
      configuration: {
        prompt: 'calm and bright',
        budget: { amountMinor: 300000, currency: 'USD' },
        requirements: [
          { id: 'req-bed', objectType: 'bed', quantity: 1, roomId: 'room-3' },
          { id: 'req-toilet', objectType: 'toilet', quantity: 1, roomId: null },
        ],
        roomInstructions: [
          { roomId: 'room-1', note: '' },
          { roomId: 'room-2', note: '' },
          { roomId: 'room-3', note: 'No TV in this room.' },
          { roomId: 'room-4', note: '' },
        ],
      },
    },
  })
  expect(configured.statusCode, configured.body).toBe(200)
  return configured.json()
}

describe('projects API', () => {
  it('creates, reloads and rejects stale writes', async () => {
    t = await createTestApp(null)
    const created = await t.app.inject({ method: 'POST', url: '/api/v1/projects', payload: { name: 'Home', unitSystem: 'imperial', mode: 'upload', demoLayoutId: 'four-room-v1' } })
    const project = created.json()
    expect(project).toMatchObject({ revision: 1, layoutSource: 'demo', floor: { width_m: 10, depth_m: 8 } })
    expect(project.floor.rooms.map((r: { type: string }) => r.type)).toEqual(['living_room', 'kitchen', 'bedroom', 'bathroom'])

    const fetched = await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })
    expect(fetched.json().floor).toEqual(project.floor)

    const patched = await t.app.inject({ method: 'PATCH', url: `/api/v1/projects/${project.id}`, payload: { expectedRevision: 1, name: 'Renamed' } })
    expect(patched.json().revision).toBe(2)
    const stale = await t.app.inject({ method: 'PATCH', url: `/api/v1/projects/${project.id}`, payload: { expectedRevision: 1, name: 'Again' } })
    expect(stale.statusCode).toBe(409)
    expect(stale.json().error.code).toBe('REVISION_CONFLICT')

    const invalid = await t.app.inject({ method: 'POST', url: '/api/v1/projects', payload: { name: 'x', unitSystem: 'metric', mode: 'scratch', demoLayoutId: 'four-room-v1', extra: 1 } })
    expect(invalid.statusCode).toBe(422)
    expect((await t.app.inject({ method: 'GET', url: '/api/v1/projects/prj_missing' })).statusCode).toBe(404)
  })

  it('stores uploads after sniffing content', async () => {
    t = await createTestApp(null)
    const project = (await t.app.inject({ method: 'POST', url: '/api/v1/projects', payload: { name: 'U', unitSystem: 'metric', mode: 'upload', demoLayoutId: 'four-room-v1' } })).json()
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

    const ok = await t.app.inject({ method: 'POST', url: `/api/v1/projects/${project.id}/floor-plan`, ...multipart({ expectedRevision: '1' }, { name: 'plan.png', type: 'image/png', data: png }) })
    expect(ok.statusCode, ok.body).toBe(201)
    const download = await t.app.inject({ method: 'GET', url: ok.json().downloadUrl })
    expect(download.rawPayload.equals(png)).toBe(true)

    const spoofed = await t.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project.id}/floor-plan`,
      ...multipart({ expectedRevision: '2' }, { name: 'plan.png', type: 'image/png', data: Buffer.from('%PDF-1.7 fake') }),
    })
    expect(spoofed.statusCode).toBe(415)

    const tooBig = await t.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project.id}/floor-plan`,
      ...multipart({ expectedRevision: '2' }, { name: 'big.png', type: 'image/png', data: Buffer.concat([png, Buffer.alloc(21 * 1024 * 1024)]) }),
    })
    expect(tooBig.statusCode).toBe(413)
    expect((await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })).json().revision).toBe(2)
  })

  it('validates configuration and room edits semantically', async () => {
    t = await createTestApp(null)
    const project = (await t.app.inject({ method: 'POST', url: '/api/v1/projects', payload: { name: 'C', unitSystem: 'metric', mode: 'scratch', demoLayoutId: 'four-room-v1' } })).json()
    const badConfig = await t.app.inject({
      method: 'PUT',
      url: `/api/v1/projects/${project.id}/configuration`,
      payload: {
        expectedRevision: 1,
        configuration: { prompt: '', requirements: [{ id: 'b', objectType: 'bed', quantity: 1, roomId: 'room-2' }], roomInstructions: project.configuration.roomInstructions },
      },
    })
    expect(badConfig.statusCode).toBe(422)
    expect(badConfig.json().error.details[0].code).toBe('ROOM_TYPE_MISMATCH')

    const note = await t.app.inject({ method: 'PATCH', url: `/api/v1/projects/${project.id}/rooms/room-3/note`, payload: { expectedRevision: 1, note: 'Prefer light wood.' } })
    expect(note.json()).toMatchObject({ revision: 2, configuration: { revision: 2 } })

    const rooms = project.floor.rooms.map((r: { id: string; label: string; type: string; polygon: unknown }) => ({ id: r.id, label: r.label, type: r.type, polygon: r.polygon }))
    rooms[0].polygon = [{ x: 0, y: 0 }, { x: 5.5, y: 0 }, { x: 5.5, y: 4 }, { x: 0, y: 4 }]
    const badRooms = await t.app.inject({ method: 'PUT', url: `/api/v1/projects/${project.id}/rooms`, payload: { expectedRevision: 2, rooms, roomTransforms: project.roomTransforms } })
    expect(badRooms.statusCode).toBe(422)
    expect(badRooms.json().error.code).toBe('INVALID_ROOMS')
  })

  it('lists furniture and safety rules', async () => {
    t = await createTestApp(null)
    const toilets = (await t.app.inject({ method: 'GET', url: '/api/v1/furniture?objectType=toilet' })).json()
    expect(toilets.items.map((i: { id: string }) => i.id)).toEqual(['default-toilet'])
    expect((await t.app.inject({ method: 'GET', url: '/api/v1/furniture?maxWidthM=-1' })).statusCode).toBe(422)
    const rules = (await t.app.inject({ method: 'GET', url: '/api/v1/rules' })).json()
    expect(rules.items.map((r: { id: string }) => r.id)).toContain('SAFE-PATHWAY')
  })
})

describe('generation with the rules-engine loop', () => {
  it('feeds rule violations back to the model until a valid layout is submitted', async () => {
    const llm = new FakeLlmClient((req, i) => {
      const ctx = contextOf(req)
      const good = goodPlacements(ctx)
      if (i === 0) {
        // Bed across the bedroom door on wall-bottom (x 4.6–5.5).
        const bad = [{ ...good[0], anchor: { type: 'wall', wallId: 'wall-bottom', alongM: 4.2 } }, good[1]]
        return { toolCalls: [{ name: 'check_layout', arguments: JSON.stringify({ placements: bad }) }] }
      }
      const last = req.messages.at(-1)!
      expect(last.role).toBe('tool')
      if (i === 1) {
        expect(last.content).toMatch(/SAFE-DOOR-SWING/)
        return { toolCalls: [{ name: 'check_layout', arguments: JSON.stringify({ placements: good }) }] }
      }
      const checked = JSON.parse(last.content as string)
      expect(checked).toMatchObject({ result: 'PASS', checkId: 'check-2' })
      return { toolCalls: [{ name: 'submit_layout', arguments: JSON.stringify({ checkId: checked.checkId, rationale: 'Bed on the solid wall, toilet opposite the door.' }) }] }
    })
    t = await createTestApp(llm)
    const project = await configuredProject(t.app)

    const post = () =>
      t!.app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project.id}/generations`,
        headers: { 'idempotency-key': 'apply-1' },
        payload: { expectedRevision: project.revision, configurationRevision: project.configuration.revision, scope: { kind: 'home' } },
      })
    const accepted = await post()
    expect(accepted.statusCode, accepted.body).toBe(202)
    await t.queue.idle()

    const generation = (await t.app.inject({ method: 'GET', url: accepted.json().statusUrl })).json()
    expect(generation).toMatchObject({ status: 'succeeded', errorCode: null })
    expect(generation.progress.turns.map((x: { tool: string; pass: boolean }) => [x.tool, x.pass])).toEqual([
      ['check_layout', false],
      ['check_layout', true],
      ['submit_layout', true],
    ])

    const layout = (await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}/layouts/${generation.layoutId}` })).json()
    expect(layout.placements).toHaveLength(2)
    expect(layout.activated).toBe(true)
    const recheck = evaluate({ rooms: demoRooms(), items: layout.placements.map((p: { id: string }) => ({ ...p, instanceId: p.id })), types: catalog().types })
    expect(recheck.violations).toEqual([])

    const reloaded = (await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })).json()
    expect(reloaded.activeLayoutId).toBe(layout.id)
    expect(reloaded.roomStatuses.find((s: { roomId: string }) => s.roomId === 'room-3').status).toBe('furnished')

    const replay = await post()
    expect(replay.json().generationId).toBe(generation.id)
    expect(llm.requests).toHaveLength(3)
  })

  it('fails with the last violations after the turn budget and keeps the previous layout', async () => {
    let succeedFirstRun = true
    const llm = new FakeLlmClient((req) => {
      const good = goodPlacements(contextOf(req))
      if (succeedFirstRun) return { toolCalls: [{ name: 'submit_layout', arguments: JSON.stringify({ placements: good, rationale: 'ok' }) }] }
      // Bed dropped onto the bedroom door (x 4.6–5.5 on wall-bottom).
      const bad = [{ ...good[0], anchor: { type: 'free', x: 5.0, y: 1.2, rot: 0 } }, ...good.slice(1)]
      return { toolCalls: [{ name: 'submit_layout', arguments: JSON.stringify({ placements: bad, rationale: 'bad' }) }] }
    })
    t = await createTestApp(llm, { maxTurns: 3 })
    const project = await configuredProject(t.app)
    const body = { expectedRevision: project.revision, configurationRevision: project.configuration.revision, scope: { kind: 'home' } }

    await t.app.inject({ method: 'POST', url: `/api/v1/projects/${project.id}/generations`, payload: body })
    await t.queue.idle()
    const firstLayout = (await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })).json().activeLayoutId
    expect(firstLayout).toBeTruthy()

    succeedFirstRun = false
    const second = await t.app.inject({ method: 'POST', url: `/api/v1/projects/${project.id}/generations`, payload: { ...body, scope: { kind: 'room', roomId: 'room-3' } } })
    await t.queue.idle()
    const failed = (await t.app.inject({ method: 'GET', url: second.json().statusUrl })).json()
    expect(failed.status).toBe('failed')
    expect(failed.errorCode).toBe('NO_VALID_LAYOUT_FOUND')
    expect(
      failed.issues.some((i: { ruleId?: string }) => i.ruleId === 'SAFE-DOOR-SWING' || i.ruleId === 'SAFE-DOOR-APPROACH'),
      JSON.stringify(failed.issues, null, 1),
    ).toBe(true)
    expect((await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })).json().activeLayoutId).toBe(firstLayout)
  })

  it('marks a result stale when the project changes mid-generation', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const llm = new FakeLlmClient(async (req) => {
      await gate
      return { toolCalls: [{ name: 'submit_layout', arguments: JSON.stringify({ placements: goodPlacements(contextOf(req)), rationale: 'ok' }) }] }
    })
    t = await createTestApp(llm)
    const project = await configuredProject(t.app)
    const post = await t.app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project.id}/generations`,
      payload: { expectedRevision: project.revision, configurationRevision: project.configuration.revision, scope: { kind: 'home' } },
    })
    while (llm.requests.length === 0) await new Promise((r) => setTimeout(r, 5))
    await t.app.inject({ method: 'PATCH', url: `/api/v1/projects/${project.id}/rooms/room-3/note`, payload: { expectedRevision: project.revision, note: 'Changed my mind.' } })
    release()
    await t.queue.idle()
    const generation = (await t.app.inject({ method: 'GET', url: post.json().statusUrl })).json()
    expect(generation.status).toBe('stale')
    expect((await t.app.inject({ method: 'GET', url: `/api/v1/projects/${project.id}` })).json().activeLayoutId).toBeNull()
  })
})
