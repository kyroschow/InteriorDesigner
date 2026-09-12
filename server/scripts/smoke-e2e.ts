/**
 * End-to-end run against the real model: create a project, configure furniture,
 * generate, and print every agent turn with the rules-engine verdict.
 *
 *   LLM_PROVIDER=ollama npm run smoke:e2e
 *   SMOKE_SIZE=full LLM_PROVIDER=openclaw npm run smoke:e2e
 */
import { appendFileSync, mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildApp } from '../src/app.ts'
import { loadCatalog } from '../src/catalog/load.ts'
import { loadConfig } from '../src/config.ts'
import { Database } from '../src/db/database.ts'
import { Store } from '../src/db/store.ts'
import { GenerationQueue } from '../src/jobs/queue.ts'
import { createLlmClient } from '../src/llm/createLlmClient.ts'

const dataDir = process.env.DATA_DIR ?? mkdtempSync(path.join(os.tmpdir(), 'interior-smoke-'))
const config = loadConfig({ ...process.env, DATA_DIR: dataDir })
const db = new Database(path.join(dataDir, 'app.db'))
const store = new Store(db)
const catalog = loadCatalog(config.inventoryDir)
const llm = createLlmClient(config)
if (!llm) throw new Error('Set LLM_PROVIDER to openclaw or ollama.')
const traceFile = path.join(dataDir, 'agent-trace.jsonl')
const queue = new GenerationQueue({ store, catalog, llm, config, trace: (entry) => appendFileSync(traceFile, `${JSON.stringify(entry)}\n`) })
const app = await buildApp({ config, store, catalog, llm, queue })

const call = async (method: string, url: string, payload?: unknown) => {
  const res = await app.inject({ method: method as 'GET', url: `/api/v1${url}`, payload: payload as object })
  if (res.statusCode >= 400) throw new Error(`${method} ${url} -> ${res.statusCode}: ${res.body}`)
  return res.json()
}

const small = [
  { id: 'req-bed', objectType: 'bed', quantity: 1, roomId: 'room-3' },
  { id: 'req-nightstand', objectType: 'nightstand', quantity: 2, roomId: 'room-3' },
  { id: 'req-toilet', objectType: 'toilet', quantity: 1, roomId: 'room-4' },
  { id: 'req-shower', objectType: 'shower', quantity: 1, roomId: 'room-4' },
]
const full = [
  ...small,
  { id: 'req-dresser', objectType: 'dresser', quantity: 1, roomId: 'room-3' },
  { id: 'req-bath-sink', objectType: 'sink', quantity: 1, roomId: 'room-4' },
  { id: 'req-sofa', objectType: 'sofa', quantity: 1, roomId: 'room-1' },
  { id: 'req-tv', objectType: 'tv_stand', quantity: 1, roomId: 'room-1' },
  { id: 'req-counter', objectType: 'kitchen_counter', quantity: 1, roomId: 'room-2' },
  { id: 'req-kitchen-sink', objectType: 'sink', quantity: 1, roomId: 'room-2' },
  { id: 'req-table', objectType: 'dining_table', quantity: 1, roomId: null },
  { id: 'req-chairs', objectType: 'dining_chair', quantity: 4, roomId: null },
]

console.log(`LLM: ${llm.id}  catalog: ${catalog.version}  trace: ${traceFile}`)
console.log('health:', await llm.health())

let project = await call('POST', '/projects', { name: 'Smoke test', unitSystem: 'metric', mode: 'scratch', demoLayoutId: 'four-room-v1' })
project = await call('PUT', `/projects/${project.id}/configuration`, {
  expectedRevision: project.revision,
  configuration: {
    prompt: 'Calm, bright and practical.',
    budget: { amountMinor: 500000, currency: 'USD' },
    requirements: process.env.SMOKE_SIZE === 'full' ? full : small,
    roomInstructions: [
      { roomId: 'room-1', note: '' },
      { roomId: 'room-2', note: '' },
      { roomId: 'room-3', note: 'No TV in this room. Prefer light wood.' },
      { roomId: 'room-4', note: '' },
    ],
  },
})

const started = Date.now()
const accepted = await call('POST', `/projects/${project.id}/generations`, {
  expectedRevision: project.revision,
  configurationRevision: project.configuration.revision,
  scope: { kind: 'home' },
})

let printed = 0
let generation
for (;;) {
  generation = await call('GET', accepted.statusUrl.replace('/api/v1', ''))
  for (const turn of generation.progress.turns.slice(printed)) {
    console.log(`turn ${turn.turn}: ${turn.tool} pass=${turn.pass ?? '-'} violations=${turn.violations ?? '-'} score=${turn.score ?? '-'} ${turn.note ?? ''} (${(turn.latencyMs / 1000).toFixed(1)} s)`)
    for (const detail of turn.details ?? []) console.log(`    - ${detail}`)
  }
  printed = generation.progress.turns.length
  if (['succeeded', 'failed', 'stale'].includes(generation.status)) break
  await new Promise((r) => setTimeout(r, 1000))
}

console.log(`\nstatus: ${generation.status} ${generation.errorCode ?? ''} after ${((Date.now() - started) / 1000).toFixed(0)} s`)
if (generation.layoutId) {
  const layout = await call('GET', `/projects/${project.id}/layouts/${generation.layoutId}`)
  console.log(`rationale: ${layout.rationale}`)
  console.log(`total: $${(layout.totalPriceMinor / 100).toFixed(2)}  score: ${layout.engineReport.score}`)
  for (const m of layout.engineReport.metrics) console.log(`  ${m.roomId}: walkable ${m.walkableAreaPct}%  narrowest path ${m.minPathWidthM ?? '-'} m`)
  for (const p of layout.placements) console.log(`  ${p.id} in ${p.roomId}: ${p.name} at (${p.pose.x}, ${p.pose.y}) rot ${p.pose.rot}`)
} else {
  for (const issue of generation.issues) console.log(`  - [${issue.code}${issue.ruleId ? ` ${issue.ruleId}` : ''}] ${issue.message}${issue.suggestion ? ` → ${issue.suggestion}` : ''}`)
}

queue.stop()
await app.close()
db.close()
process.exit(generation.status === 'succeeded' ? 0 : 1)
