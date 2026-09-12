import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildApp } from '../src/app.ts'
import { type Catalog, loadCatalog } from '../src/catalog/load.ts'
import { loadConfig } from '../src/config.ts'
import { Database } from '../src/db/database.ts'
import { Store } from '../src/db/store.ts'
import type { Room } from '../src/domain/types.ts'
import { DEMO_ROOMS, DEMO_TRANSFORMS } from '../src/fixtures/fourRoomV1.ts'
import { GenerationQueue } from '../src/jobs/queue.ts'
import type { LlmClient } from '../src/llm/types.ts'
import { buildFloor } from '../src/rooms/reconstruct.ts'

export const INVENTORY_DIR = path.resolve(import.meta.dirname, '../../inventory')

let cachedCatalog: Catalog | null = null
export const catalog = () => (cachedCatalog ??= loadCatalog(INVENTORY_DIR))

export const demoRooms = (): Room[] => buildFloor(DEMO_ROOMS, DEMO_TRANSFORMS).rooms
export const demoRoom = (id: string): Room => demoRooms().find((r) => r.id === id)!

export async function createTestApp(llm: LlmClient | null, overrides: { maxTurns?: number } = {}) {
  const dataDir = mkdtempSync(path.join(os.tmpdir(), 'interior-test-'))
  const base = loadConfig({ DATA_DIR: dataDir, INVENTORY_DIR, LLM_PROVIDER: 'none' })
  const config = { ...base, generation: { ...base.generation, maxTurns: overrides.maxTurns ?? base.generation.maxTurns } }
  const db = new Database(path.join(dataDir, 'app.db'))
  const store = new Store(db)
  const queue = new GenerationQueue({ store, catalog: catalog(), llm, config })
  const app = await buildApp({ config, store, catalog: catalog(), llm, queue })
  return {
    app,
    store,
    queue,
    dataDir,
    async close() {
      queue.stop()
      await app.close()
      db.close()
      rmSync(dataDir, { recursive: true, force: true })
    },
  }
}

export function multipart(fields: Record<string, string>, file?: { name: string; type: string; data: Buffer }) {
  const boundary = '----interiortest'
  const chunks: Buffer[] = []
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  }
  if (file) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`))
    chunks.push(file.data, Buffer.from('\r\n'))
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  return { payload: Buffer.concat(chunks), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}
